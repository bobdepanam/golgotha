'use client';

import styles from '@/styles/components/Breadcrumb.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Mapping custom des noms d'URL vers noms affichés
  const labelMap: Record<string, string> = {
    home: 'Index',
    projects: 'Γολγοθᾶ[ς]',
    about: 'Canem',
    contact: 'Contact',
    archive: 'Archive',
  };

  const crumbs = [
    { name: labelMap['home'], href: '/' }, // Home toujours mappé
    ...segments.map((segment, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const raw = decodeURIComponent(segment).replace(/-/g, ' ');
      const name = labelMap[segment.toLowerCase()] || raw;
      return { name, href };
    }),
  ];

  return (
    <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className={styles.item}>
          <Link href={crumb.href} className={styles.link}>
            {crumb.name}
          </Link>
          {index < crumbs.length - 1 && <span className={styles.separator}>/</span>}
        </span>
      ))}
    </nav>
  );
}