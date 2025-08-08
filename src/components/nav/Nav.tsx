'use client';

import styles from '@/styles/components/Nav.module.scss';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { blur, menuSlide } from './anim';
import Lien from './Lien';

type NavItem = {
  title: string;
  href: string;
};

type NavProps = {
  onClose: () => void;
};

const navItems: NavItem[] = [
  { title: 'index', href: '/' },
  { title: 'Γολγοθᾶ[ς]', href: '/projects' },
  { title: 'Canem', href: '/about' },
];

export default function Nav({ onClose }: NavProps): JSX.Element {
  const pathname = usePathname();
  const [selectedIndicator, setSelectedIndicator] = useState<string>(pathname);

  return (
    <motion.div
      variants={menuSlide}
      initial="initial"
      animate="enter"
      exit="exit"
      className={styles.menu}
    >
      <div className={styles.body}>
        <motion.div
          onMouseLeave={() => setSelectedIndicator(pathname)}
          className={styles.nav}
          variants={blur}
          initial="initial"
          whileHover="hover"
        >
          <div className={styles.header}>
            <p>Ready to be shot into space</p>
            <button onClick={onClose} className={styles.closeButton}>
              Close
            </button>
          </div>

          {navItems.map((data, index) => (
            <Lien
              key={index}
              data={{ ...data, index }}
              isActive={selectedIndicator === data.href}
              setSelectedIndicator={setSelectedIndicator}
              onClick={onClose}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
