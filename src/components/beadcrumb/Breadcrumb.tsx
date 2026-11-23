'use client';

import { locationLabel } from '@/config/navigation';
import { useProjectTitles } from '@/context/ProjectTitlesContext';
import styles from '@/styles/components/Breadcrumb.module.scss';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function Breadcrumb() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const projectTitles = useProjectTitles();
  const segments = pathname.split('/').filter(Boolean);

  // Hook appelé à chaque rendu (règles des hooks : jamais dans une condition)
  const goBack = useCallback<React.MouseEventHandler<HTMLButtonElement>>((e) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // Bouton Back conservé uniquement sur /experiment (open world sans widget).
  // About / Contact : remplacé par le widget SiteDock et le rond central.
  const backPages = ['experiment'];
  if (segments.length === 1 && backPages.includes(segments[0])) {
    return (
      <nav className={styles.breadcrumb} aria-label="Retour">
        <button
          type="button"
          onClick={goBack}
          className={styles.backBtn}
          aria-label="Revenir à la page précédente"
        >
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path
              d="M15.53 4.47a.75.75 0 0 1 0 1.06L9.06 12l6.47 6.47a.75.75 0 1 1-1.06 1.06l-7-7a.75.75 0 0 1 0-1.06l7-7a.75.75 0 0 1 1.06 0Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.label}>Back</span>
        </button>
      </nav>
    );
  }

  // Repère de localisation : texte simple, non cliquable (le point blanc mène à
  // /projects). Grammaire uniforme `/projects`, `/canem`, `/talk`, `/bibliotheca`,
  // `/<titre du projet>`. Source : config/navigation + titres réels des projets.
  const label = locationLabel(pathname, projectTitles);
  if (!label) return null;

  return (
    <div className={`${styles.breadcrumb} ${styles.location}`}>
      <span className={styles.current} aria-current="page">
        /{label}
      </span>
    </div>
  );
}
