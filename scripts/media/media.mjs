#!/usr/bin/env node
// Médias BSTRDZ sur Cloudflare R2 (7.1) — npm run media:status | media:list | media:pull | media:push
//
//   npm run media:status
//   npm run media:list -- [univers[/slug]]               ex. altar, golgotha/through-shadows
//   npm run media:pull -- <univers[/slug]> [--dry-run]   R2 → .media/<univers>/<slug>/ (ignoré par Git)
//   npm run media:push -- <univers/slug> [--from <dossier>] [--dry-run] [--overwrite]
//
// Bucket : bstrdz-media (privé), remote rclone « bstrdz-r2 » (scripts/media/rclone.conf, sans
// secret ; identifiants : secrets Codespaces R2_*, via scripts/media/r2-env.sh).
// Sécurité : `rclone copy` uniquement (jamais sync, jamais de suppression) ; fichiers existants
// conservés sauf --overwrite ; sources de travail, WAV / AIFF / FLAC, PSD / AE / PR, temporaires,
// Markdown et secrets toujours exclus. Univers autorisés : golgotha, altar, myrr, simple, shared.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BUCKET = process.env.BSTRDZ_BUCKET || 'bstrdz-media';
const REMOTE = `bstrdz-r2:${BUCKET}`;
const UNIVERSES = ['golgotha', 'altar', 'myrr', 'simple', 'shared'];
const WORK_DIR = path.join(ROOT, '.media'); // copies locales issues de R2 (ignorées par Git / Vercel)

// Jamais transférés (sources de travail, masters, temporaires, secrets, contenus éditoriaux)
const EXCLUDES = [
  '_*/**', '**/_*/**', '.*', '**/.*',
  '*.md', '*.env', '*.env.*', '*.key', '*.pem',
  '*.wav', '*.aif', '*.aiff', '*.flac',
  '*.psd', '*.psb', '*.ai', '*.aep', '*.prproj', '*.tif', '*.tiff', '*.mov',
  '*.tmp', '*.part', '*.crdownload', '*~', 'Thumbs.db',
];

const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const fromIdx = rest.indexOf('--from');
const from = fromIdx >= 0 ? rest[fromIdx + 1] : null;
const target = rest.find((a, i) => !a.startsWith('--') && !(fromIdx >= 0 && i === fromIdx + 1)) ?? '';

function fail(msg) {
  console.error(`[media] ✗ ${msg}`);
  process.exit(1);
}

/** Exécute rclone avec l'environnement R2 (secrets jamais affichés). */
function rclone(args, { capture = false } = {}) {
  const sh = `source "${path.join(ROOT, 'scripts/media/r2-env.sh')}" && rclone "$@"`;
  const r = spawnSync('bash', ['-c', sh, 'rclone', ...args], { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (r.status !== 0) {
    if (capture) process.stderr.write((r.stderr || '').replace(/[A-Za-z0-9/+]{30,}/g, '••••'));
    fail(`rclone a échoué (code ${r.status})`);
  }
  return r.stdout ?? '';
}

/** univers[/slug] → préfixe validé (aucune sortie du bucket, aucun chemin réservé). */
function prefixOf(t, { needSlug = false, optional = false } = {}) {
  if (!t) {
    if (optional) return '';
    fail(`cible attendue : <univers>${needSlug ? '/<slug>' : '[/slug]'} (univers : ${UNIVERSES.join(', ')})`);
  }
  const [u, slug, ...more] = t.replace(/^\/+|\/+$/g, '').split('/');
  if (!UNIVERSES.includes(u)) fail(`univers inconnu « ${u} » (${UNIVERSES.join(', ')})`);
  if (more.length) fail('cible trop profonde : <univers>/<slug> au plus');
  if (slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(`slug invalide « ${slug} »`);
  if (needSlug && !slug) fail('un envoi cible un projet précis : <univers>/<slug>');
  return slug ? `${u}/${slug}` : u;
}

/** Dossier local d'un projet pour un envoi (ou --from). */
function sourceDir(prefix) {
  if (from) return path.resolve(ROOT, from);
  const [u, slug] = prefix.split('/');
  if (u === 'simple') return path.join(ROOT, 'content/simple', slug);
  if (u === 'shared') return path.join(WORK_DIR, 'shared', slug);
  return path.join(ROOT, 'content/projects', slug);
}

const excludeArgs = EXCLUDES.flatMap((e) => ['--exclude', e]);
const dry = flags.has('--dry-run') ? ['--dry-run'] : [];

switch (cmd) {
  case 'status': {
    const v = spawnSync('bash', ['-c', 'PATH="$HOME/.local/bin:$PATH" rclone version'], { encoding: 'utf8' });
    console.log(`[media] rclone : ${v.status === 0 ? v.stdout.split('\n')[0] : 'absent — npm run media:setup'}`);
    for (const k of ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT']) {
      console.log(`[media] ${k} : ${process.env[k] ? 'présent' : 'MANQUANT'}`);
    }
    if (v.status !== 0) process.exit(1);
    const out = rclone(['lsjson', REMOTE, '-R', '--files-only', '--fast-list'], { capture: true });
    const files = JSON.parse(out || '[]');
    const by = Object.fromEntries(UNIVERSES.map((u) => [u, { n: 0, bytes: 0 }]));
    let other = 0;
    for (const f of files) {
      const u = f.Path.split('/')[0];
      if (by[u]) {
        by[u].n += 1;
        by[u].bytes += f.Size;
      } else other += 1;
    }
    console.log(`[media] ✓ ${REMOTE} accessible — ${files.length} objet(s)`);
    for (const [u, s] of Object.entries(by)) console.log(`  ${u.padEnd(9)} ${String(s.n).padStart(5)} objet(s)  ${(s.bytes / 1048576).toFixed(1)} Mo`);
    if (other) console.log(`  (hors univers : ${other})`);
    break;
  }
  case 'list': {
    const p = prefixOf(target, { optional: true });
    rclone(['lsf', `${REMOTE}/${p}`, '--format', 'sp', '--separator', '  ', ...(p ? ['-R'] : ['--max-depth', '1'])]);
    break;
  }
  case 'pull': {
    const p = prefixOf(target);
    const dest = path.join(WORK_DIR, p);
    if (!dry.length) fs.mkdirSync(dest, { recursive: true });
    console.log(`[media] ${REMOTE}/${p} → .media/${p}${dry.length ? ' (dry-run)' : ''}`);
    rclone(['copy', `${REMOTE}/${p}`, dest, '--ignore-existing', ...excludeArgs, ...dry, '--stats-one-line', '-v']);
    break;
  }
  case 'push': {
    const p = prefixOf(target, { needSlug: true });
    const src = sourceDir(p);
    if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) fail(`dossier source introuvable : ${path.relative(ROOT, src)}`);
    const keep = flags.has('--overwrite') ? [] : ['--ignore-existing'];
    console.log(`[media] ${path.relative(ROOT, src)} → ${REMOTE}/${p}${dry.length ? ' (dry-run)' : ''}${keep.length ? '' : ' (écrasement autorisé)'}`);
    rclone(['copy', src, `${REMOTE}/${p}`, ...keep, ...excludeArgs, ...dry, '--stats-one-line', '-v']);
    break;
  }
  default:
    console.log('Usage : npm run media:status | media:list -- [univers[/slug]] | media:pull -- <univers[/slug]> [--dry-run] | media:push -- <univers/slug> [--from <dossier>] [--dry-run] [--overwrite]');
    process.exit(cmd ? 1 : 0);
}
