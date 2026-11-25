'use client';

// État du SiteDock (navigation globale) : visibilité selon la route et ouverture du MENU.
// BSTRDZ 7.0.7b : le contenu contextuel (ex-vue INFO) est géré à part, par le Contextual
// Widget (ContextWidgetContext) — les deux états sont indépendants.

import { isDockRoute } from '@/config/navigation';
import { usePathname } from 'next/navigation';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type DockUIContextValue = {
  /** La capsule est affichée sur la page courante */
  visible: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const DockUIContext = createContext<DockUIContextValue | undefined>(undefined);

export function DockUIProvider({ children }: PropsWithChildren) {
  const pathname = usePathname() || '/';
  const [isOpen, setIsOpen] = useState(false);

  // Changement de page : menu fermé
  useEffect(() => setIsOpen(false), [pathname]);

  const visible = isDockRoute(pathname);

  // Sécurité : jamais ouvert sur une route sans widget
  useEffect(() => {
    if (!visible) setIsOpen(false);
  }, [visible]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);

  const value = useMemo(
    () => ({ visible, isOpen: visible && isOpen, open, close, toggle }),
    [visible, isOpen, open, close, toggle]
  );

  return <DockUIContext.Provider value={value}>{children}</DockUIContext.Provider>;
}

export function useDockUI() {
  const context = useContext(DockUIContext);
  if (!context) throw new Error('useDockUI must be used within a DockUIProvider');
  return context;
}
