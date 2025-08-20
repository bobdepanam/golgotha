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
            <Link href="/projects"><h2 className={styles.footerTitle}>Γολγοθᾶ[ς]</h2></Link>
          </div>
          <div className={styles.footColumn}>
            <span className={styles.footTitle}></span>
            <Link href="/contact">talk</Link>
          </div>
        </div>
      </div>
    </footer >
  );
}
