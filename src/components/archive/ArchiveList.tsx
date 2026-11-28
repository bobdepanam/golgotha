'use client';

// Liste interactive de Bibliothéca.
// - Survol : CSS seul (visuel plein écran, souris), indépendant de la sélection et de la lecture.
// - Clic / tap : sélectionne l'entrée et l'affiche dans le Contextual Widget (7.0.7b) :
//   cover, univers, méta, accroche, lecteur audio (si piste). Pas de CTA « Open » (7.0.8).
// - 7.1 : création vidéo → la vraie vidéo est lue dans le widget (le fond de survol reste une
//   image fixe). Lecture audio GLOBALE : une nouvelle sélection ou la fermeture du widget
//   n'interrompt pas la piste en cours ; la nouvelle piste se lance depuis son lecteur.
// - Le dernier projet sélectionné reste dans le widget replié (réouverture sans autoplay).
// - BSTRDZ 7.0.6 : index global (projets Golgotha + produits Simple) ; entrées identifiées par
//   leur id d'index (un slug peut exister dans les deux collections) ; visuel plein écran
//   chargé au premier survol / focus d'une rangée (et de ses voisines), pas tous d'emblée.

import { CONTEXT_WIDGET_ID } from '@/components/contextWidget/ContextWidget';
import { projectsViewState } from '@/components/projects/projectsViewState';
import { useContextWidget, useContextWidgetState } from '@/context/ContextWidgetContext';
import { setProjectSequence } from '@/lib/navigation/projectSequence';
import styles from '@/styles/pages/Archive.module.scss';
import { getLenis } from '@/utils/lenis';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ArchiveEntry = {
  /** Identifiant d'index (`projects:<slug>` / `simple:<slug>`) */
  id: string;
  slug: string;
  collection: 'projects' | 'simple';
  /** Univers affiché dans INFO (Golgotha / Simple) */
  universe: string;
  /** Page de détail */
  href: string;
  title: string;
  year: string;
  category: string;
  cover: string | null;
  /** Miniature carrée (V8) : vignette ou cover du projet */
  thumb?: string | null;
  /** Visuel plein écran au survol (URL optimisée ; repli : cover) */
  preview: string | null;
  /** Source audio (optionnelle) */
  audio: string | null;
  /** Nature de la création (7.1) : graphic | video | audio */
  kind: 'graphic' | 'video' | 'audio' | null;
  /** Aperçu vidéo réel (7.1) : lu dans le Contextual Widget à la sélection */
  video: { src: string; poster: string | null } | null;
  /** Accroche (produits), si connue */
  tagline: string | null;
  /** Données provisoires affichées (prévisualisation locale uniquement) */
  provisional: boolean;
};


/** Libellé de nature (7.1) : Graphic / Video / Audio */
const kindLabel = (k: ArchiveEntry['kind']) => (k ? k.charAt(0).toUpperCase() + k.slice(1) : null);

/** Mélange de Fisher-Yates (une fois par entrée dans Bibliothéca) */
function shuffled<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Copies rendues pour la boucle (une seule si la liste est trop courte pour boucler) */
const LOOP_COPIES = 3;

export default function ArchiveList({ entries: source }: { entries: ArchiveEntry[] }) {
  // Ordre mélangé (V8) : calculé UNE fois après le montage — stable pendant toute la consultation
  // (re-rendus, widget, lecteur, redimensionnement) ; rendu serveur dans l'ordre chronologique,
  // invisible jusqu'au mélange (aucun écart d'hydratation visible)
  const [entries, setEntries] = useState<ArchiveEntry[]>(source);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setEntries(shuffled(source));
    setReady(true);
    // une seule fois par montage (nouvelle entrée dans Bibliothéca = nouvel ordre)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Boucle infinie (V8) : 3 copies si la liste est assez haute, sinon une seule
  const [copies, setCopies] = useState(1);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { publish, retract } = useContextWidget();
  const { isOpen, content } = useContextWidgetState();
  const [selected, setSelected] = useState<number | null>(null);
  const [openRequest, setOpenRequest] = useState(0);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  const [resumeOnLoad, setResumeOnLoad] = useState(false);
  // Visuels plein écran « armés » (chargés) : au premier survol / focus d'une rangée
  const [armed, setArmed] = useState<Set<number>>(() => new Set());
  const arm = useCallback((i: number) => {
    setArmed((prev) => {
      if (prev.has(i) && prev.has(i - 1) && prev.has(i + 1)) return prev;
      const next = new Set(prev);
      for (const k of [i - 1, i, i + 1]) next.add(k);
      return next;
    });
  }, []);

  // Navigation Next (7.1) : depuis Bibliothéca, la séquence suit l'ordre affiché (projets) ;
  // le Back des pages projet ramène ici
  useEffect(() => {
    if (!ready) return;
    setProjectSequence({ origin: 'archive', slugs: entries.filter((e) => e.collection === 'projects').map((e) => e.slug) });
    projectsViewState.lastHref = '/archive';
  }, [entries, ready]);

  // Boucle : activée si une copie couvre au moins ~55 % de l'écran (sinon une seule copie)
  useEffect(() => {
    if (!ready) return;
    const decide = () => {
      const list = listRef.current;
      const first = list?.querySelector<HTMLElement>('[data-copy="0"]');
      if (!list || !first) return;
      // Hauteur d'UNE copie : écart entre les débuts de copies, ou étendue de la copie unique
      const second = list.querySelector<HTMLElement>('[data-copy="1"]');
      const last = list.lastElementChild as HTMLElement | null;
      const h = second ? second.offsetTop - first.offsetTop : last ? last.offsetTop + last.offsetHeight - first.offsetTop : 0;
      setCopies(entries.length > 1 && h >= window.innerHeight * 0.55 ? LOOP_COPIES : 1);
    };
    decide();
    window.addEventListener('resize', decide);
    return () => window.removeEventListener('resize', decide);
  }, [ready, entries.length]);

  // Repositionnement sans saut : passé le début de la 2e copie, on recule d'une copie (contenu
  // identique) — via Lenis s'il est actif, sinon le défilement natif
  useEffect(() => {
    if (copies < LOOP_COPIES) return;
    const list = listRef.current;
    if (!list) return;
    let copyH = 0;
    let start1 = 0;
    const measure = () => {
      const a = list.querySelector<HTMLElement>('[data-copy="0"]');
      const b = list.querySelector<HTMLElement>('[data-copy="1"]');
      if (!a || !b) return;
      start1 = b.getBoundingClientRect().top + window.scrollY;
      copyH = b.getBoundingClientRect().top - a.getBoundingClientRect().top;
    };
    measure();
    let jumping = false;
    const onScroll = () => {
      if (jumping || copyH <= 0) return;
      const y = window.scrollY;
      if (y < start1) return;
      jumping = true;
      const target = y - copyH;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
      else window.scrollTo(0, target);
      requestAnimationFrame(() => (jumping = false));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, [copies]);

  // Entrées jouables, pour précédent / suivant
  const playable = useMemo(() => entries.flatMap((e, i) => (e.audio ? [i] : [])), [entries]);


  const select = (i: number) => {
    setResumeOnLoad(false);
    setSelected(i);
    setOpenRequest((n) => n + 1);
  };

  const step = (dir: 1 | -1) => (resume: boolean) => {
    if (selected === null) return;
    const pos = playable.indexOf(selected);
    const next = playable[(pos + dir + playable.length) % playable.length];
    if (next === undefined) return;
    setResumeOnLoad(resume);
    setSelected(next);
  };

  const onPlayingChange = useCallback((src: string | null) => setPlayingSrc(src), []);

  const entry = selected !== null ? entries[selected] : null;
  const navigable = !!entry?.audio && playable.length > 1;
  const widgetKey = entry ? `archive:${entry.id}` : null;

  // Contextual Widget : entrée sélectionnée (cover, univers, méta, accroche, audio si présent).
  // Ouvert à chaque sélection (clic / tap) ; fermé → replié (la lecture audio, globale, continue).
  // Précédent / suivant : nouvelle entrée, reprise de la lecture si elle était en cours.
  useEffect(() => {
    if (!entry || !widgetKey) return;
    publish(
      {
        key: widgetKey,
        universe: entry.universe,
        title: entry.title,
        meta: [entry.category !== '—' ? entry.category : null, kindLabel(entry.kind), entry.year || null].filter(Boolean).join(' · ') || null,
        image: entry.cover ? { src: entry.cover, alt: '' } : null,
        // Création vidéo : la vraie vidéo (muette, en boucle), poster pendant le chargement
        video: entry.video ? { src: entry.video.src, poster: entry.video.poster ?? entry.cover } : null,
        tagline: entry.tagline,
        provisional: entry.provisional,
        audio: entry.audio
          ? {
              src: entry.audio,
              title: entry.title,
              origin: entry.href,
              onPrev: navigable ? step(-1) : undefined,
              onNext: navigable ? step(1) : undefined,
              onPlayingChange,
              resumeOnLoad,
            }
          : null,
        closeMode: 'collapse',
      },
      { open: true, focus: openRequest > 0 }
    );
    // `step` dépend de `selected` (déjà dans la clé) ; republication à chaque sélection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetKey, openRequest, publish]);

  // Démontage (changement de page) : le contenu est retiré du widget
  useEffect(() => () => (widgetKey ? retract(widgetKey) : undefined), [widgetKey, retract]);

  return (
    <>
      <div ref={listRef} className={styles.list} data-ready={ready || undefined}>
        {Array.from({ length: copies }, (_, copy) =>
          entries.map((e, i) => {
            const isSelected = isOpen && content?.key === `archive:${e.id}`;
            const isPlaying = !!e.audio && playingSrc === e.audio;
            const clone = copy > 0; // copies de boucle : hors lecteurs d'écran et tabulation
            return (
              <div
                key={`${e.id}:${copy}`}
                className={[styles.item, isSelected ? styles.isSelected : '', isPlaying ? styles.isPlaying : ''].join(' ')}
                data-collection={e.collection}
                data-copy={i === 0 ? copy : undefined}
                aria-hidden={clone || undefined}
                onPointerEnter={() => arm(i)}
                onFocus={() => arm(i)}
              >
                {/* Visuel plein écran au survol (souris uniquement, voir Archive.module.scss) ;
                    image chargée seulement une fois la rangée survolée ou atteinte au clavier */}
                {e.preview && (
                  <div
                    className={styles.preview}
                    style={armed.has(i) ? { backgroundImage: `url(${e.preview})` } : undefined}
                    aria-hidden
                  />
                )}

                <button
                  type="button"
                  className={styles.row}
                  aria-pressed={isSelected}
                  aria-controls={CONTEXT_WIDGET_ID}
                  tabIndex={clone ? -1 : undefined}
                  data-cursor="hover"
                  onClick={() => select(i)}
                >
                  {/* Miniature carrée (V8) — remplace l'année ; repli discret sans visuel */}
                  <span className={styles.thumb} aria-hidden>
                    {e.thumb ?? e.cover ? (
                      <Image src={(e.thumb ?? e.cover) as string} alt="" width={48} height={48} sizes="48px" quality={60} />
                    ) : null}
                  </span>
                  <span className={styles.title}>{e.title}</span>
                  <span className={styles.category}>
                    {[e.category, kindLabel(e.kind)].filter((x) => x && x !== '—').join(' · ') || '—'}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
