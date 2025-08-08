'use client';

import styles from '@/styles/components/IntroReveal.module.scss';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
  text?: string;
  trigger: boolean;
  destination: string;
  onComplete?: () => void;
};

export default function TextTransition({
  text = '{ Golgotha }',
  trigger,
  destination,
  onComplete,
}: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(trigger);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
    }
  }, [trigger]);

  const handleComplete = () => {
    setVisible(false);
    router.push(destination);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.introWrapper}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className={styles.introText}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={handleComplete}
          >
            {text}
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
