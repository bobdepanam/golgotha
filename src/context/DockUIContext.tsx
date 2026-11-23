'use client';

// État unique du widget global (SiteDock) : ouverture, vue active (INFO / MENU),
// disponibilité des infos projet et emplacement du portail INFO.

import { isDockRoute, isProjectDetailRoute } from '@/config/navigation';
import { usePathname } from 'next/navigation';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type DockView = 'info' | 'menu';

type DockUIContextValue = {
  /** Le bouton rond est affiché sur la page courante */
  visible: boolean;
  isOpen: boolean;
  /** Vue effectivement affichée (INFO uniquement si une page projet l'a fournie) */
  view: DockView;
  /** Une page projet a enregistré ses informations */
  infoAvailable: boolean;
  /** Élément DOM où la page projet rend ses informations (portail) */
  infoSlot: HTMLElement | null;
  open: (view?: DockView) => void;
  close: () => void;
  toggle: () => void;
  setView: (view: DockView) => void;
  setInfoSlot: (el: HTMLElement | null) => void;
  /** Déclare des infos projet disponibles ; renvoie la fonction de retrait */
  registerInfo: () => () => void;
};

const DockUIContext = createContext<DockUIContextValue | undefined>(undefined);

export function DockUIProvider({ children }: PropsWithChildren) {
  const pathname = usePathname() || '/';
  const [isOpen, setIsOpen] = useState(false);
  const [preferredView, setPreferredView] = useState<DockView>('info');
  const [infoCount, setInfoCount] = useState(0);
  const [infoSlot, setInfoSlot] = useState<HTMLElement | null>(null);

  // Changement de page : widget fermé, INFO prioritaire si la page en fournit.
  useEffect(() => {
    setIsOpen(false);
    setPreferredView('info');
  }, [pathname]);

  const infoAvailable = infoCount > 0;
  const view: DockView = preferredView === 'info' && !infoAvailable ? 'menu' : preferredView;

  // Pages projet : le bouton n'apparaît qu'une fois les infos enregistrées par la page.
  const visible = isDockRoute(pathname) && (!isProjectDetailRoute(pathname) || infoAvailable);

  // Sécurité : jamais ouvert sur une route sans widget.
  useEffect(() => {
    if (!visible) setIsOpen(false);
  }, [visible]);

  const open = useCallback((v?: DockView) => {
    if (v) setPreferredView(v);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const setView = useCallback((v: DockView) => setPreferredView(v), []);

  const registerInfo = useCallback(() => {
    setInfoCount((c) => c + 1);
    return () => setInfoCount((c) => Math.max(0, c - 1));
  }, []);

  const value = useMemo(
    () => ({
      visible,
      isOpen: visible && isOpen,
      view,
      infoAvailable,
      infoSlot,
      open,
      close,
      toggle,
      setView,
      setInfoSlot,
      registerInfo,
    }),
    [visible, isOpen, view, infoAvailable, infoSlot, open, close, toggle, setView, registerInfo]
  );

  return <DockUIContext.Provider value={value}>{children}</DockUIContext.Provider>;
}

export function useDockUI() {
  const context = useContext(DockUIContext);
  if (!context) {
    throw new Error('useDockUI must be used within a DockUIProvider');
  }
  return context;
}
