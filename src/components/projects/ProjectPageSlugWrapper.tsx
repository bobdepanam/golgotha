'use client';

import ProjectPlayer from '@/components/projects/ProjectPlayer';
import TextTransition from '@/components/transition/TextTransition';
import styles from '@/styles/projects/Slugpage.module.scss';
import type { Project } from '@/types/project';
import Image from 'next/image';
import { useState } from 'react';

type Props = {
  project: Project;
};

export default function ProjectPageClientWrapper({ project }: Props) {
  const [reveal, setReveal] = useState(true);

  const {
    subtitle,
    category,
    description,
    external_link,
    mainImage,
    gallery,
    playerAudio,
  } = project.projectFields ?? {};

  const media = [
    ...(mainImage?.node?.mediaItemUrl ? [{ ...mainImage.node, type: 'main' }] : []),
    ...(gallery?.nodes?.length
      ? gallery.nodes.map((img) => ({ ...img, type: 'gallery' }))
      : []),
  ];

  return (
    <>
      <TextTransition
        text={project.title}
        trigger={reveal}
        destination={`/projects/${project.slug}`} // Optionnel : déjà sur la page
        onComplete={() => setReveal(false)}
      />

      {!reveal && (
        <div className={styles.projectWrapper}>
          <header className={styles.header}>
            <h2 className={styles.title}>{project.title}</h2>
          </header>

          <section className={styles.projectSection}>
            <div className={styles.grid}>
              <div className={styles.imagesColumn}>
                {media.map((img, idx) => (
                  <div key={img.id ?? idx} className={styles.imageWrapper}>
                    <Image
                      src={img.mediaItemUrl}
                      alt={img.title ?? 'Visuel projet'}
                      width={1200}
                      height={819}
                      style={{ width: '100%', height: 'auto' }}
                      className={styles.image}
                    />
                  </div>
                ))}
              </div>

              <aside className={styles.detailsColumn}>
                <div className={styles.detailsSticky}>
                  {category && (
                    <div className={styles.detailLine}>
                      <span>Catégorie :</span>
                      <span>{category}</span>
                    </div>
                  )}
                  {subtitle && (
                    <div className={styles.detailLine}>
                      <span>Sous-titre :</span>
                      <span>{subtitle}</span>
                    </div>
                  )}
                  {description && (
                    <div className={styles.description}>
                      <span>Description :</span>
                      <div dangerouslySetInnerHTML={{ __html: description }} />
                    </div>
                  )}
                  {playerAudio && (
                    <div className={styles.audioPlayers}>
                      <ProjectPlayer tracks={[playerAudio]} />
                    </div>
                  )}
                  {external_link && (
                    <a
                      href={external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalLink}
                      data-cursor="hover"
                    >
                      Voir la page en ligne ↗
                    </a>
                  )}
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
