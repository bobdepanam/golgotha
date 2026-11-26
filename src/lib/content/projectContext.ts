// Contenu du Contextual Widget pour un projet Golgotha (BSTRDZ 7.0.7b) — fonction pure,
// partagée : page projet aujourd'hui ; grille / liste Projects quand une sélection l'alimentera.
// Même contenu que l'ancienne vue INFO : catégorie · année, index, description, textes,
// liens externes, piste audio. Aucun champ vide.
import type { ContextContent } from '@/context/ContextWidgetContext';
import type { FlexibleContentBlock, Project } from '@/types/project';

const isText = (b: FlexibleContentBlock) => b.__typename === 'ProjectFieldsFlexibleContentBlocksTextBlockLayout';
const isAudio = (b: FlexibleContentBlock) => b.__typename === 'ProjectFieldsFlexibleContentBlocksAudioBlockLayout';
const isLink = (b: FlexibleContentBlock) => b.__typename === 'ProjectFieldsFlexibleContentBlocksExternalLinkBlockLayout';

export function projectContextContent(project: Project, options: { href?: boolean } = {}): ContextContent {
  const pf = project.projectFields ?? {};
  const blocks = project.projectFieldsFlexible?.contentBlocks ?? [];
  const category = pf.category?.trim() || project.projectFieldsFlexible?.category?.trim() || null;
  const texts = blocks.filter(isText).map((b) => ('content' in b ? b.content : null)).filter(Boolean) as string[];
  const audioBlock = blocks.filter(isAudio).find((b) => 'fileUrl' in b && b.fileUrl) as
    | { fileUrl?: string | null; title?: string | null }
    | undefined;
  const audioSrc = pf.playerAudio || audioBlock?.fileUrl || null;
  const links = blocks
    .filter(isLink)
    .map((b) => b as { url?: string | null; label?: string | null })
    .filter((b) => b.url)
    .map((b) => ({ label: b.label || (b.url as string), url: b.url as string }));

  return {
    key: `projects:${project.slug}`,
    universe: 'Golgotha',
    title: project.title,
    meta: [category, project.kind ? project.kind.charAt(0).toUpperCase() + project.kind.slice(1) : null, project.year].filter(Boolean).join(' · ') || null,
    specs: pf.subtitle ? [{ label: 'Index', value: pf.subtitle }] : [],
    bodyHtml: [pf.description, ...texts].filter(Boolean).join('') || null,
    links,
    audio: audioSrc ? { src: audioSrc, title: audioBlock?.title || project.title, origin: `/projects/${project.slug}` } : null,
    href: options.href ? `/projects/${project.slug}` : null,
    ctaLabel: 'Open',
    closeMode: 'collapse',
  };
}
