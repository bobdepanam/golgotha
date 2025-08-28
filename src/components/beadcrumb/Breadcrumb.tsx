'use client';

import styles from '@/styles/components/Breadcrumb.module.scss';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function Breadcrumb() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const segments = pathname.split('/').filter(Boolean);

  // Pages alternatives → on affiche juste le bouton back
  const altPages = ['about', 'experiment', 'contact'];
  if (segments.length === 1 && altPages.includes(segments[0])) {
    const goBack = useCallback<React.MouseEventHandler<HTMLButtonElement>>((e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }, [router]);

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

  // Sinon, cas projets : breadcrumb normal
  if (segments.length === 0 || segments[0] !== 'projects') return null;

  const labelMap: Record<string, string> = {
    projects: 'Γολγοθᾶ[ς]',
  };

  const crumbs = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const raw = decodeURIComponent(segment).replace(/-/g, ' ');
    const name = labelMap[segment.toLowerCase()] || raw;
    return { name, href };
  });

  return (
    <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className={styles.item}>
            {isLast ? (
              <span aria-current="page" className={styles.current}>
                {crumb.name}
              </span>
            ) : (
              <Link href={crumb.href} className={styles.link}>
                {crumb.name}
              </Link>
            )}
            {!isLast && <span className={styles.separator}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
