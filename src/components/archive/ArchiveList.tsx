'use client';

// Liste interactive de Bibliothéca.
// - Survol : CSS seul (visuel plein écran, souris), indépendant de la sélection et de la lecture.
// - Clic / tap : sélectionne l'entrée et ouvre le widget SiteDock en vue INFO, où la cover
//   et l'audio sont rendus (même mécanisme que les pages projet : registerInfo + portail).
// - Une nouvelle sélection arrête la lecture précédente et prépare la nouvelle source,
//   sans la lancer. Fermer le widget arrête la lecture ; INFO ↔ MENU ne la coupe pas.
// - Le dernier projet sélectionné reste dans INFO après fermeture (réouverture sans autoplay).

import { useDockUI } from '@/context/DockUIContext';
import styles from '@/styles/pages/Archive.module.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ArchiveAudio from './ArchiveAudio';

export type ArchiveEntry = {
  slug: string;
  title: string;
  year: string;
  category: string;
  cover: string | null;
  /** Source audio (optionnelle) */
  audio: string | null;
};

/** Panneau du widget global (SiteDock), contrôlé par les rangées. */
const DOCK_PANEL_ID = 'site-dock-panel';

export default function ArchiveList({ entries }: { entries: ArchiveEntry[] }) {
  const { infoSlot, registerInfo, open, isOpen } = useDockUI();
  const [selected, setSelected] = useState<number | null>(null);
  const [openRequest, setOpenRequest] = useState(0);
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);
  const [resumeOnLoad, setResumeOnLoad] = useState(false);

  // Entrées jouables, pour précédent / suivant
  const playable = useMemo(() => entries.flatMap((e, i) => (e.audio ? [i] : [])), [entries]);

  // INFO disponible dans le widget dès la première sélection (déclaré avant l'ouverture :
  // enregistrement et ouverture arrivent dans la même mise à jour, sans passage par MENU).
  const hasSelection = selected !== null;
  useEffect(() => (hasSelection ? registerInfo() : undefined), [hasSelection, registerInfo]);

  // Ouverture du widget en vue INFO à chaque clic / tap sur une entrée.
  useEffect(() => {
    if (openRequest) open('info');
  }, [openRequest, open]);

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

  const onPlayingChange = useCallback((slug: string | null) => setPlayingSlug(slug), []);

  const entry = selected !== null ? entries[selected] : null;
  const navigable = !!entry?.audio && playable.length > 1;

  return (
    <>
      <div className={styles.list}>
        {entries.map((e, i) => {
          const isSelected = isOpen && selected === i;
          const isPlaying = playingSlug === e.slug;
          return (
            <div
              key={e.slug}
              className={[styles.item, isSelected ? styles.isSelected : '', isPlaying ? styles.isPlaying : ''].join(' ')}
            >
              {/* Visuel plein écran au survol (souris uniquement, voir Archive.module.scss) */}
              {e.cover && (
                <div className={styles.preview} style={{ backgroundImage: `url(${e.cover})` }} aria-hidden />
              )}

              <button
                type="button"
                className={styles.row}
                aria-pressed={isSelected}
                aria-controls={DOCK_PANEL_ID}
                data-cursor="hover"
                onClick={() => select(i)}
              >
                <span className={styles.year}>{e.year}</span>
                <span className={styles.title}>{e.title}</span>
                <span className={styles.category}>{e.category}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Contenu de la vue INFO du widget : reste monté (un seul <audio>) tant qu'une entrée est sélectionnée */}
      {infoSlot &&
        entry &&
        createPortal(
          <ArchiveAudio
            entry={entry}
            active={isOpen}
            onPrev={navigable ? step(-1) : undefined}
            onNext={navigable ? step(1) : undefined}
            onPlayingChange={onPlayingChange}
            resumeOnLoad={resumeOnLoad}
          />,
          infoSlot
        )}
    </>
  );
}
