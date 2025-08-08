import styles from '@/styles/components/Nav.module.scss';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { scale, slide } from './anim';

type LienProps = {
  data: {
    title: string;
    href: string;
    index: number;
  };
  isActive: boolean;
  setSelectedIndicator: (href: string) => void;
  onClick: () => void;
};

export default function Lien({
  data,
  isActive,
  setSelectedIndicator,
  onClick,
}: LienProps): JSX.Element {
  const { title, href, index } = data;

  return (
    <motion.div
      className={styles.link}
      onMouseEnter={() => setSelectedIndicator(href)}
      custom={index}
      variants={slide}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <motion.div
        variants={scale}
        animate={isActive ? 'open' : 'closed'}
        className={styles.indicator}
      />
      <Link href={href} onClick={onClick}>
        {title}
      </Link>
    </motion.div>
  );
}
