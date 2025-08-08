"use client";
import SwitchGrid from "@/icons/grid.svg";
import SwitchList from "@/icons/list.svg";
import styles from "@/styles/components/ProjectViewSwitcher.module.scss";
import { AnimatePresence, motion } from "framer-motion";
import type { FC } from "react";
import React from "react"; // ← AJOUTE React ici

type Props = {
  defaultView?: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
};

const ProjectViewSwitcher: FC<Props> = ({ defaultView = "grid", onChange }) => {
  const [view, setView] = React.useState<"grid" | "list">(defaultView);

  const handleSwitch = (newView: "grid" | "list") => {
    if (view !== newView) {
      setView(newView);
      onChange(newView);
    }
  };

  return (
    <div className={styles.toggleRow}>
      {/* Grid button */}
      <button
        onClick={() => handleSwitch("grid")}
        className={`${styles.toggle} ${view === "grid" ? styles.active : ""}`}
        aria-label="Afficher en grille"
        type="button"
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, rotate: 0, scale: 0.9 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <SwitchGrid />
            </motion.div>
          )}
          {view !== "grid" && (
            <motion.div
              key="grid-inactive"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.6, scale: 0.9 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.14 }}
              style={{ filter: "grayscale(0.6)", pointerEvents: "none" }}
            >
              <SwitchGrid />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* List button */}
      <button
        onClick={() => handleSwitch("list")}
        className={`${styles.toggle} ${view === "list" ? styles.active : ""}`}
        aria-label="Afficher en liste"
        type="button"
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, rotate: 0, scale: 0.9 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <SwitchList />
            </motion.div>
          )}
          {view !== "list" && (
            <motion.div
              key="list-inactive"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.6, scale: 0.9 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.14 }}
              style={{ filter: "grayscale(0.6)", pointerEvents: "none" }}
            >
              <SwitchList />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default ProjectViewSwitcher;
