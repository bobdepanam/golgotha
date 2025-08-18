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
            <Link href="/projects">Index</Link>
          </div>
          <div className={styles.footColumn}>
            <span className={styles.footTitle}></span>
            <Link href="/about">Cave</Link>
          </div>
        </div>
        <h2 className={styles.footerTitle}>Golgotha</h2>
      </div>
    </footer>
  );
}
