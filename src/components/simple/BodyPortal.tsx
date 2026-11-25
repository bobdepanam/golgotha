'use client';

// Calque d'interface de /simple, rendu directement sous <body>.
// Raison : #pageContent forme un contexte d'empilement (z-index 1) placé SOUS le flou global
// des bords de Golgotha (GlobalEdgeBlur, z-index 9, backdrop-filter). Tout ce qui est rendu
// dans la page — quel que soit son z-index — est donc flouté par ces bandes. Les contrôles
// de Simple (filtres, sélecteur, panneau de description, panneau mobile) sont rendus ici,
// au-dessus des bandes et du header, sous le cube (10000) et le SiteDock (11000).
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
