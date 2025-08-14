"use client";

import styles from "@/styles/projects/ProjectCard.module.scss";
import type { Project } from "@/types/project";
import { getProjectThumb } from "@/utils/project";
import Image from "next/image";
import Link from "next/link";

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  const imageUrl = getProjectThumb(project);
  const category = project.projectFields?.category ?? null;
  const excerpt = project.excerpt ?? "";
  const slug = project.slug;

  return (
    <li className={styles.card}>
      <Link
        href={`/projects/${slug}`}
        className={styles.link}
        aria-label={`Voir le projet ${project.title}`}
      >
        {imageUrl ? (
          <div className={styles.imageWrapper}>
            <Image
              src={imageUrl}
              alt={`Image du projet ${project.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={false}
            // style={{ objectFit: "cover" }} // décommente si besoin
            />
          </div>
        ) : (
          <div
            className={styles.imageWrapper}
            aria-hidden="true"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              background: "var(--backdrop-bg, #111)",
            }}
          />
        )}

        <div className="group">
          <h2 className={styles.title}>{project.title}</h2>
          {category && <p className={styles.category}>{category}</p>}
          {excerpt && (
            <div
              className={styles.excerpt}
              dangerouslySetInnerHTML={{ __html: excerpt }}
            />
          )}
        </div>
      </Link>
    </li>
  );
}
