// Cible de sortie du moteur de contenu, isolée par mode (BSTRDZ 7.0.7a) :
//   développement (npm run dev, --dev)   → src/generated/dev/  + public/media-dev/  (brouillons par défaut)
//   production    (npm run build, --build) → src/generated/prod/ + public/media/      (jamais de brouillons)
// Un build ne peut plus écraser les données ni les médias du serveur de développement (et
// inversement). Next choisit le dossier de données selon le mode (alias @generated,
// next.config.js). --check n'écrit rien (cible de production, pour les URL affichées).
import path from 'node:path';

const ROOT = process.cwd();
export const TARGET = process.argv.includes('--dev') ? 'dev' : 'prod';
export const GENERATED_DIR = path.join(ROOT, 'src', 'generated', TARGET);
export const PUBLIC_ROOT = path.join(ROOT, 'public', TARGET === 'dev' ? 'media-dev' : 'media');
export const URL_ROOT = TARGET === 'dev' ? '/media-dev' : '/media';
