// Grille éditoriale de /projects : covers + titre + catégorie.
// Aucun état, aucun écouteur : le survol est géré en CSS (ProjectGrid.module.scss).

import styles from "@/styles/projects/ProjectGrid.module.scss";
import type { FlexibleContentBlock, Project } from "@/types/project";
import Image from "next/image";
import Link from "next/link";

// Image de repli depuis le contenu flexible (poster vidéo, image, puis 1re image de galerie)
function getFirstFlexibleCover(blocks?: FlexibleContentBlock[] | null): string | null {
  if (!blocks) return null;
  for (const b of blocks) {
    if (b.__typename === "ProjectFieldsFlexibleContentBlocksVideoBlockLayout") {
      const u = b.poster?.node?.mediaItemUrl;
      if (u) return u;
    }
  }
  for (const b of blocks) {
    if (b.__typename === "ProjectFieldsFlexibleContentBlocksImageBlockLayout") {
      const u = b.image?.node?.mediaItemUrl;
      if (u) return u;
    }
  }
  for (const b of blocks) {
    if (b.__typename === "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout") {
      const n0 = b.images?.nodes?.find((n) => n?.mediaItemUrl)?.mediaItemUrl;
      if (n0) return n0;
    }
  }
  return null;
}

const coverOf = (p: Project) =>
  p.image ||
  p.projectFields?.mainImage?.node?.mediaItemUrl ||
  getFirstFlexibleCover(p.projectFieldsFlexible?.contentBlocks) ||
  null;

const categoryOf = (p: Project) =>
  p.projectFields?.category?.trim() || p.projectFieldsFlexible?.category?.trim() || "";

// Largeur réelle d'une cover selon la grille (voir ProjectGrid.module.scss)
const SIZES = "(max-width: 599px) 50vw, (max-width: 899px) 33vw, (max-width: 1279px) 25vw, 20vw";

type Props = { projects: Project[] };

export default function ProjectGrid({ projects }: Props) {
  return (
    <ul className={styles.grid}>
      {projects.map((p, i) => {
        const cover = coverOf(p);
        const category = categoryOf(p);
        return (
          <li key={p.slug} className={styles.item}>
            <Link href={`/projects/${p.slug}`} className={styles.link} data-cursor="hover">
              <span className={styles.media}>
                {cover && (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes={SIZES}
                    className={styles.image}
                    priority={i < 5}
                  />
                )}
              </span>
              <span className={styles.caption}>
                <span className={styles.title}>{p.title}</span>
                {category && <span className={styles.category}>{category}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
