'use client';

import ProjectFilters, { filterHref, selectFilter, type Chip } from "@/components/filters/ProjectFilters";
import ProjectGrid from "@/components/projects/ProjectGrid";
import { projectsViewState } from "@/components/projects/projectsViewState";
import { killSwap, swapView } from "@/lib/motion/swap";
import { ViewToggle } from "@/components/simple/controls/ViewToggle";
import type { ListEntry } from "@/components/simple/list/types";
import { useIsDesktop } from "@/components/simple/useIsDesktop";
import styles from "@/styles/projects/Catalog.module.scss";
import type { Project } from "@/types/project";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// Grille avec shader WebGL (three.js) : uniquement /projects-test, chargée à la demande
// pour ne pas alourdir /projects.
const ProjectGridTest = dynamic(() => import("@/components/projects/ProjectGridTest"));
// Module de filtres (Framer Motion) : chargé après l'affichage, hors du premier chargement
const CategoryDock = dynamic(() => import("@/components/simple/controls/CategoryDock").then((m) => m.CategoryDock), { ssr: false });
// Mode List (liste éditoriale + effet List FX) : chargé seulement quand il est choisi
const ScrollGallery = dynamic(() => import("@/components/simple/list/ScrollGallery").then((m) => m.ScrollGallery));

type Props = {
  projects: Project[];
  /** Catégories réelles (dérivées des données) pour la ligne de filtres */
  chips?: Chip[];
  /** /projects-test : grille avec effet shader (ProjectGridTest) */
  testMode?: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Un projet appartient à un filtre par sa catégorie (champs legacy / flexible) ou, depuis la
 *  7.1, par sa nature (graphic / video / audio) : une même entrée « Video » réunit les deux. */
function projectHasCat(p: Project, slug: string) {
  const is = (label?: string | null) => typeof label === "string" && slugify(label) === slug;
  return is(p.projectFields?.category) || is(p.projectFieldsFlexible?.category) || is(p.kind);
}

type CatalogProps = Props & { active: string | null };

/** Catalogue : /projects (Grid / List, filtres flottants) ou /projects-test (inchangé). */
export function ProjectsCatalog(props: CatalogProps) {
  return props.testMode ? <TestCatalog {...props} /> : <ProjectsModes {...props} />;
}

/** Image affichée dans la grille et la liste (vignette, sinon cover). */
const imageOf = (p: Project) => p.thumbnail ?? p.image ?? p.featuredImage?.node?.mediaItemUrl ?? null;

/** Ratio réel de l'image affichée (vignette propre, sinon cover). */
function ratioOf(p: Project): number | null {
  const size = p.thumbnail ? p.thumbnailSize : p.featuredImage?.node?.mediaDetails;
  return size?.width && size?.height ? size.width / size.height : null;
}

const categoryLabel = (p: Project) => p.projectFields?.category?.trim() || p.projectFieldsFlexible?.category?.trim() || "";

/**
 * /projects — Grid (grille Golgotha, par défaut) ou List (liste éditoriale de Simple, effet
 * List FX, ratios réels des visuels). Filtre : module flottant de Simple, piloté par `?cat=`
 * (liens directs et rendu serveur inchangés) ; masqué si aucune catégorie ne regroupe au
 * moins deux projets. Chaque mode garde sa position de défilement (session).
 */
function ProjectsModes({ projects, chips = [], active }: CatalogProps) {
  const visible = active ? projects.filter((p) => projectHasCat(p, active)) : projects;
  // Grille : tous les projets restent rendus, le filtre est animé (FLIP, ProjectGrid)
  const visibleSlugs = useMemo(() => new Set(visible.map((p) => p.slug)), [visible]);
  const isDesktop = useIsDesktop();
  const [mode, setMode] = useState(() => projectsViewState.mode);
  const switched = useRef(false);

  // Catégories réelles + effectifs ; filtrage pertinent seulement si une catégorie en regroupe ≥ 2
  const categories = useMemo(
    () => chips.map((c) => ({ id: c.slug, label: c.label, count: projects.filter((p) => projectHasCat(p, c.slug)).length })),
    [chips, projects]
  );
  const filterable = categories.length >= 2 && categories.some((c) => c.count >= 2);

  const viewRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onCategory = useCallback((id: string) => {
    // Même mécanisme que la rangée de filtres : remplacement d'URL, pas de navigation.
    // Grid : animation FLIP de la grille ; List : fondu court du conteneur (7.0.1)
    const apply = () => {
      window.history.replaceState(null, "", filterHref(id === "all" ? null : id));
      projectsViewState.lastHref = filterHref(id === "all" ? null : id);
    };
    if (modeRef.current === "list") swapView(viewRef.current, apply);
    else apply();
  }, []);
  useEffect(() => () => killSwap(viewRef.current), []);

  const onMode = useCallback(
    (next: "spatial" | "list") => {
      if (next === mode) return;
      if (mode === "spatial") projectsViewState.gridScrollY = window.scrollY;
      projectsViewState.mode = next;
      // Grid ⇄ List : fondu court (7.0.1)
      swapView(viewRef.current, () => {
        switched.current = true;
        setMode(next);
      });
    },
    [mode]
  );

  // Sortie de /projects (ex. vers une page projet) : URL et position de la grille mémorisées
  // pour le Back mutualisé ; retour par ce Back : position de la grille restaurée (7.0.10)
  useEffect(() => {
    if (projectsViewState.restoreGrid) {
      projectsViewState.restoreGrid = false;
      if (projectsViewState.mode === "spatial") {
        const y = projectsViewState.gridScrollY;
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }));
      }
    }
    // Suivi continu (la sortie peut survenir après la remise à zéro du défilement)
    const track = () => {
      if (window.location.pathname !== "/projects") return;
      projectsViewState.lastHref = `/projects${window.location.search}`;
      if (projectsViewState.mode === "spatial") projectsViewState.gridScrollY = window.scrollY;
    };
    track();
    window.addEventListener("scroll", track, { passive: true });
    return () => window.removeEventListener("scroll", track);
  }, []);

  // Retour en Grid : position mémorisée (la liste restaure la sienne elle-même)
  useLayoutEffect(() => {
    if (mode === "spatial" && switched.current) window.scrollTo({ top: projectsViewState.gridScrollY, behavior: "instant" as ScrollBehavior });
    switched.current = false;
  }, [mode]);

  const entries = useMemo<ListEntry[]>(
    () =>
      visible.flatMap((p) => {
        const image = imageOf(p);
        if (!image) return [];
        const cat = categoryLabel(p);
        return [
          {
            key: p.slug,
            href: `/projects/${p.slug}`,
            title: p.title,
            ariaLabel: cat ? `${p.title} — ${cat}` : p.title,
            meta: [cat, p.year].filter(Boolean).join(" · ") || null,
            image,
            ratio: ratioOf(p),
          },
        ];
      }),
    [visible]
  );

  const empty = (
    <p className={styles.empty}>
      <span>{active ? "Aucun projet dans cette catégorie." : "Aucun projet pour le moment."}</span>
      {active && (
        <Link href={filterHref(null)} replace scroll={false} className={styles.emptyLink} onClick={selectFilter}>
          Voir tous les projets
        </Link>
      )}
    </p>
  );

  return (
    <>
      <div ref={viewRef}>
        {mode === "list" && visible.length > 0 ? (
          <ScrollGallery key="list" entries={entries} memory={projectsViewState.list} />
        ) : (
          <div className={styles.catalog}>
            {visible.length === 0 ? empty : <ProjectGrid projects={projects} visibleSlugs={visibleSlugs} />}
          </div>
        )}
      </div>
      <ViewToggle mode={mode} onChange={onMode} labels={{ spatial: "Grid view", list: "List view" }} />
      {filterable && isDesktop !== null && (
        <CategoryDock categories={categories} active={active ?? "all"} onChange={onCategory} variant={isDesktop ? "desktop" : "mobile"} />
      )}
    </>
  );
}

/** /projects-test : catalogue d'origine (rangée de filtres + grille shader), inchangé. */
function TestCatalog({ projects, chips = [], testMode = false, active }: CatalogProps) {
  const visible = active ? projects.filter((p) => projectHasCat(p, active)) : projects;

  return (
    <div className={styles.catalog}>
      <ProjectFilters chips={chips} active={active} />

      {visible.length === 0 ? (
        <p className={styles.empty}>
          <span>{active ? "Aucun projet dans cette catégorie." : "Aucun projet pour le moment."}</span>
          {active && (
            <Link href={filterHref(null)} replace scroll={false} className={styles.emptyLink} onClick={selectFilter}>
              Voir tous les projets
            </Link>
          )}
        </p>
      ) : testMode ? (
        <ProjectGridTest projects={visible} />
      ) : (
        <ProjectGrid projects={visible} />
      )}
    </div>
  );
}

/** Lit `?cat=` dans l'URL (précédent / suivant compris) et affiche le catalogue filtré. */
export default function ProjectsPageClientWrapper(props: Props) {
  const params = useSearchParams();
  return <ProjectsCatalog {...props} active={params.get("cat") || null} />;
}
