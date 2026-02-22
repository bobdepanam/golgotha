'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import styles from '@/styles/components/DockToggleOverlay.module.scss';

type DockToggleHandler = () => void;

type DockToggleConfig = {
  onToggle: DockToggleHandler;
  isOpen: boolean;
  labelOpen?: string;
  labelClosed?: string;
};

type DockUIContextValue = {
  visible: boolean;
  isOpen: boolean;
  labelOpen: string;
  labelClosed: string;
  onToggle: DockToggleHandler | null;
  show: (config: DockToggleConfig) => void;
  hide: () => void;
};

const DEFAULT_LABEL_OPEN = 'Fermer le dock infos';
const DEFAULT_LABEL_CLOSED = 'Ouvrir le dock infos';

type DockOverlayState = {
  onToggle: DockToggleHandler;
  isOpen: boolean;
  labelOpen: string;
  labelClosed: string;
};

const DockUIContext = createContext<DockUIContextValue | undefined>(undefined);

export function DockUIProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const [overlay, setOverlay] = useState<DockOverlayState | null>(null);

  const show = useCallback((config: DockToggleConfig) => {
    setOverlay({
      onToggle: config.onToggle,
      isOpen: config.isOpen,
      labelOpen: config.labelOpen ?? DEFAULT_LABEL_OPEN,
      labelClosed: config.labelClosed ?? DEFAULT_LABEL_CLOSED,
    });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setOverlay(null);
  }, []);

  const value = useMemo(
    () => ({
      visible,
      isOpen: overlay?.isOpen ?? false,
      labelOpen: overlay?.labelOpen ?? DEFAULT_LABEL_OPEN,
      labelClosed: overlay?.labelClosed ?? DEFAULT_LABEL_CLOSED,
      onToggle: overlay?.onToggle ?? null,
      show,
      hide,
    }),
    [hide, overlay, show, visible]
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

export function DockToggleOverlay() {
  const { visible, onToggle, isOpen, labelOpen, labelClosed } = useDockUI();

  if (!visible || !onToggle) return null;

  return (
    <button
      type="button"
      className={styles.toggleBtn}
      aria-label={isOpen ? labelOpen : labelClosed}
      onClick={onToggle}
    >
      {isOpen ? '×' : '≡'}
    </button>
  );
}
