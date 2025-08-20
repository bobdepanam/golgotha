"use client";

import styles from "@/styles/components/ProjectViewSwitcher.module.scss";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

type View = "grid" | "list";

type Props = {
  defaultView?: View;
  onChange?: (view: View) => void;
  labels?: { grid: string; list: string };
  storageKey?: string;
};

export default function ProjectViewSwitcher({
  defaultView = "grid",
  onChange,
  labels = { grid: "Cards", list: "Index" },
  storageKey = "project:view",
}: Props) {
  const [view, setView] = useState<View>(defaultView);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) as View | "gridfx" | null;
      // compat ancien "gridfx" -> "grid"
      const initial: View = saved === "list" ? "list" : "grid";
      setView(initial);
      onChange?.(initial);
    } catch {
      setView(defaultView);
      onChange?.(defaultView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = useCallback(
    (v: View) => {
      setView(v);
      try {
        window.localStorage.setItem(storageKey, v);
      } catch { }
      onChange?.(v);
    },
    [onChange, storageKey]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g") {
        apply(view === "grid" ? "list" : "grid");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apply, view]);

  return (
    <nav className={styles.switcher} aria-label="Changer l’affichage des projets">
      <button
        type="button"
        className={`${styles.tab} ${view === "list" ? styles.active : ""}`}
        aria-pressed={view === "list"}
        onClick={() => apply("list")}
      >
        <span className={styles.label}>{labels.list}</span>
        {view === "list" && (
          <motion.span
            layoutId="pvw-underline"
            className={styles.underline}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </button>

      <span className={styles.sep}>/</span>

      <button
        type="button"
        className={`${styles.tab} ${view === "grid" ? styles.active : ""}`}
        aria-pressed={view === "grid"}
        onClick={() => apply("grid")}
      >
        <span className={styles.label}>{labels.grid}</span>
        {view === "grid" && (
          <motion.span
            layoutId="pvw-underline"
            className={styles.underline}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </button>
    </nav>
  );
}
