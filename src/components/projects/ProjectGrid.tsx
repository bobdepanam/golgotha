import styles from "@/styles/projects/ProjectGrid.module.scss";
import type { Project } from "@/types/project";
import Image from "next/image";
import Link from "next/link";

type Props = {
  projects: Project[];
};

// Log en dev si un slug est dupliqué (pour debug éventuel)
function checkForDuplicateSlugs(projects: Project[]) {
  if (process.env.NODE_ENV !== "production") {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    projects.forEach((p) => {
      if (seen.has(p.slug)) duplicates.push(p.slug);
      else seen.add(p.slug);
    });
    if (duplicates.length > 0) {
      // @ts-ignore
      console.error(
        "%c[ProjectGrid] Duplicate slug(s) found: ",
        "color: red; font-weight: bold;",
        duplicates.join(", ")
      );
    }
  }
}

export default function ProjectGrid({ projects }: Props) {
  checkForDuplicateSlugs(projects);

  return (
    <section className={styles.grid}>
      {projects.map((project) => (
        <Link
          href={`/projects/${project.slug}`}
          key={project.slug}
          className={styles.gridItem}
          data-cursor="hover"
        >
          {project.projectFields?.mainImage?.node?.mediaItemUrl && (
            <div className={styles.imgWrapper}>
              <Image
                src={project.projectFields.mainImage.node.mediaItemUrl}
                alt={project.title}
                fill
                className={styles.image}
                sizes="(max-width: 450px) 100vw, (max-width: 1080px) 20vw, 10vw"
              />
            </div>
          )}
          <div className={styles.caption}>
            <h2>{project.title}</h2>
            {project.projectFields?.category && (
              <p>{project.projectFields.category}</p>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
