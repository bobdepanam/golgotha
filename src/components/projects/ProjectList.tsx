"use client";
import styles from "@/styles/pages/ProjectsList.module.scss";
import type { Project } from "@/types/project";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  projects: Project[];
};

export default function ProjectList({ projects }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className={styles.listContainer}>
      <ul className={styles.list}>
        {projects.map((project) => (
          <li
            key={project.slug}
            className={styles.listItem}
            onMouseEnter={() =>
              setPreview(project.projectFields?.mainImage?.node?.mediaItemUrl ?? null)
            }
            onMouseLeave={() => setPreview(null)}
          >
            <Link href={`/projects/${project.slug}`} className={styles.link} data-cursor="hover">
              <span className={styles.name}>{project.title}</span>
              {project.projectFields?.category && (
                <span className={styles.category}>{project.projectFields.category}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {/* Preview image au hover, en fixed centrée */}
      {preview && (
        <div className={styles.preview}>
          <Image src={preview} alt="Preview" width={400} height={400} />
        </div>
      )}
    </div>
  );
}
