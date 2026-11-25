// SIMPLE (7.0.10) : la transition interne grille ↔ fiche (simpleMorph) persiste entre
// /simple et /simple/[slug]. Aucun rendu propre : les pages restent inchangées.
import SimpleTransitions from '@/components/simple/transition/SimpleTransitions';
import type { PropsWithChildren } from 'react';

export default function SimpleLayout({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <SimpleTransitions />
    </>
  );
}
