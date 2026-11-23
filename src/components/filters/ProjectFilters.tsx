'use client';

// Ligne de filtres de /projects : toujours visible, catégories réelles uniquement.
// Source de vérité unique : le paramètre d'URL `?cat=`.
// - Clic simple : `history.replaceState` (Next 14 synchronise useSearchParams) →
//   filtrage instantané, sans requête serveur ni entrée d'historique.
// - Clic avec modificateur / sans JavaScript : comportement natif du lien.
// Même chemin → le moteur de transitions n'intervient pas.

import styles from "@/styles/projects/ProjectFilters.module.scss";
import Link from "next/link";
import type { MouseEvent } from "react";

export type Chip = { slug: string; label: string };

/** URL d'un filtre (null = All). */
export const filterHref = (slug: string | null) =>
  slug ? `/projects?cat=${encodeURIComponent(slug)}` : "/projects";

/** Applique un filtre en remplaçant l'entrée d'historique courante (pas de navigation). */
export function selectFilter(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.history.replaceState(null, "", e.currentTarget.href);
}

type Props = {
  chips: Chip[];
  /** slug actif (`?cat=`), ou null pour All */
  active: string | null;
};

export default function ProjectFilters({ chips, active }: Props) {
  if (!chips.length) return null;

  const items = [{ slug: null as string | null, label: "All" }, ...chips];

  return (
    <nav className={styles.filters} aria-label="Filtrer les projets par catégorie">
      <ul className={styles.list}>
        {items.map(({ slug, label }) => (
          <li key={slug ?? "all"}>
            <Link
              href={filterHref(slug)}
              replace
              scroll={false}
              className={styles.link}
              aria-current={slug === active ? "true" : undefined}
              onClick={selectFilter}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
