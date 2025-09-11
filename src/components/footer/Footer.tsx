'use client';

import styles from '@/styles/components/Footer.module.scss';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.sectionBottom}>
        <div className={styles.footContainer}>
          <div className={styles.footColumn}>
            <span className={styles.footTitle}></span>
            <Link href="/projects" className={styles.footerLink} aria-label="Voir les projets">
              <span className={styles.linkContent}>
                {/* 🔔 Icône (modifiable) : grille 2x2 */}
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={styles.icon}
                  aria-hidden="true"
                >
                  <path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" />
                </svg> */}

                {/* On garde ton style de titre */}
                <h2 className={styles.footerTitle}>index</h2>
              </span>
            </Link>
          </div>
          <div className={styles.footColumn}>
            <span className={styles.footTitle}></span>
            <Link href="/experiment" className={styles.footerLink}>
              <span className={styles.linkContent}>
                {/* world */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={styles.icon}
                >
                  <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
