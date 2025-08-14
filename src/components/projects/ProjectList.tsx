"use client";

import styles from "@/styles/projects/ProjectsList.module.scss";
import type { Project } from "@/types/project";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = { projects: Project[] };

export default function ProjectList({ projects }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className={styles.listContainer}>
      <ul className={styles.list}>
        {projects.map((project, index) => {
          const hoverImg =
            project.image ||
            project.projectFields?.mainImage?.node?.mediaItemUrl ||
            null;

          const category =
            project.projectFields?.category?.trim() ||
            // @ts-ignore → fallback flexible
            project.projectFieldsFlexible?.category?.trim() ||
            "";

          return (
            <li
              key={project.slug}
              className={styles.listItem}
              style={{ ["--item-index" as any]: index }}
              onMouseEnter={() => setPreview(hoverImg)}
              onMouseLeave={() => setPreview(null)}
            >
              <Link
                href={`/projects/${project.slug}`}
                className={styles.link}
                data-cursor="hover"
              >
                <span className={styles.name}>{project.title}</span>
                {category && (
                  <span className={styles.category}>{category}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {preview && (
        <div className={styles.preview}>
          <Image
            src={preview}
            alt="Preview"
            fill
            priority={false}
            className={styles.previewImage}
          />
        </div>
      )}
    </div>
  );
}
