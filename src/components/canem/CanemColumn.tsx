'use client';

// Colonne de texte de CANEM — portage React 18 de Simple (AboutColumn.tsx, f975918) :
// `columnRepeats` copies empilées du même jeu de paragraphes (boucle infinie par
// duplication contrôlée), découpage en lignes réelles (retours à la ligne du navigateur)
// et `update()` impératif piloté par l'unique RAF du parent (aucun RAF ici).
// Mode `simple` (mobile / mouvement réduit) : une seule copie statique, défilement natif.
// Seule adaptation : `forwardRef` (React 18) au lieu de la prop `ref` (React 19).
//
// Invariant (repris de Simple) : la mesure ne lit le DOM que pendant le rendu « mots »
// (`lines === null`) ; toute nouvelle mesure passe par `requestRemeasure`.

import styles from '@/styles/canem/CanemColumn.module.scss';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { CANEM_MOTION, distortionOffset } from './canemMotion';

export interface CanemColumnHandle {
  update: (offset: number, velocity: number, elapsedMs: number, viewportHeight: number) => void;
}

interface CanemColumnProps {
  paragraphs: string[];
  reverse: boolean;
  simple?: boolean;
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export const CanemColumn = forwardRef<CanemColumnHandle, CanemColumnProps>(function CanemColumn(
  { paragraphs, reverse, simple = false },
  ref
) {
  const repeats = CANEM_MOTION.columnRepeats;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const firstBlockRef = useRef<HTMLDivElement>(null);

  // null = pas encore mesuré : rendu « mots » servant uniquement à détecter les retours
  const [lines, setLines] = useState<string[][] | null>(null);

  const lineElsRef = useRef<HTMLSpanElement[][]>([]);
  const relTopsRef = useRef<number[]>([]);
  const blockHeightRef = useRef(0);

  // Regroupe les mots en lignes visuelles d'après les sauts d'offsetTop (copie 0 seulement)
  const measureLines = useCallback(() => {
    if (simple) return;
    const container = firstBlockRef.current;
    if (!container) return;
    const paraEls = Array.from(container.querySelectorAll<HTMLElement>('[data-para]'));
    const result: string[][] = paraEls.map((p) => {
      const wordEls = Array.from(p.querySelectorAll<HTMLElement>('[data-word]'));
      const rows: string[][] = [];
      let lastTop: number | null = null;
      for (const w of wordEls) {
        const top = w.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 1) {
          rows.push([]);
          lastTop = top;
        }
        rows[rows.length - 1].push(w.textContent ?? '');
      }
      return rows.map((row) => row.join(' '));
    });
    setLines(result);
  }, [simple]);

  useLayoutEffect(() => {
    if (lines === null) measureLines();
  }, [lines, measureLines]);

  const requestRemeasure = useCallback(() => {
    if (simple) return;
    setLines(null);
  }, [simple]);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(requestRemeasure);
    };
    window.addEventListener('resize', onResize);
    // Nouvelle mesure une fois les polices chargées
    document.fonts?.ready?.then(requestRemeasure).catch(() => {});
    return () => {
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
    };
  }, [requestRemeasure]);

  // Lignes réelles en place : positions relatives et hauteur d'une copie (lues une fois)
  useLayoutEffect(() => {
    if (simple) return;
    const block = firstBlockRef.current;
    if (!block || !lines) return;
    const blockTop = block.getBoundingClientRect().top;
    blockHeightRef.current = block.getBoundingClientRect().height;
    const flat = lineElsRef.current[0] ?? [];
    relTopsRef.current = flat.map((el) => el.getBoundingClientRect().top - blockTop);
  }, [lines, simple]);

  useImperativeHandle(
    ref,
    () => ({
      update: (offset, velocity, elapsedMs, viewportHeight) => {
        if (simple) return;
        const blockHeight = blockHeightRef.current;
        if (blockHeight <= 0 || !wrapperRef.current) return;
        const wrapped = ((offset % blockHeight) + blockHeight) % blockHeight;
        wrapperRef.current.style.transform = `translateY(${-wrapped}px)`;

        const relTops = relTopsRef.current;
        for (let copyIndex = 0; copyIndex < repeats; copyIndex += 1) {
          const copyEls = lineElsRef.current[copyIndex];
          if (!copyEls) continue;
          for (let i = 0; i < copyEls.length; i += 1) {
            const el = copyEls[i];
            const relTop = relTops[i];
            if (!el || relTop === undefined) continue;
            const screenTop = copyIndex * blockHeight + relTop - wrapped;
            const progress = Math.min(Math.max(screenTop / viewportHeight, 0), 1);
            const x = distortionOffset(progress, elapsedMs, velocity, reverse);
            el.style.transform = `translateX(${x.toFixed(2)}px)`;
          }
        }
      },
    }),
    [repeats, reverse, simple]
  );

  if (simple) {
    return (
      <div className={styles.simpleBlock}>
        {paragraphs.map((text, pIdx) => (
          <p key={pIdx} className={styles.paragraph}>
            {text}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {Array.from({ length: repeats }, (_, copyIndex) => {
        let flatIndex = -1;
        return (
          <div
            key={copyIndex}
            className={styles.block}
            ref={copyIndex === 0 ? firstBlockRef : undefined}
            aria-hidden={copyIndex === 0 ? undefined : true}
          >
            {paragraphs.map((text, pIdx) => (
              <p key={pIdx} data-para className={styles.paragraph}>
                {lines === null
                  ? splitWords(text).map((word, wIdx) => (
                      <span key={wIdx} data-word className={styles.word}>
                        {word}{' '}
                      </span>
                    ))
                  : (lines[pIdx] ?? []).map((lineText, lIdx) => {
                      flatIndex += 1;
                      const thisFlatIndex = flatIndex;
                      return (
                        <span
                          key={lIdx}
                          className={styles.line}
                          ref={(el) => {
                            if (!lineElsRef.current[copyIndex]) lineElsRef.current[copyIndex] = [];
                            if (el) lineElsRef.current[copyIndex][thisFlatIndex] = el;
                          }}
                        >
                          {lineText}
                        </span>
                      );
                    })}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
});
