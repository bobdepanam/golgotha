// lib/graphql/queries.ts

/** ===============================
 *  LISTE — Tous les projets (cards)
 *  - featuredImage (WP natif)
 *  - ancien ACF (fallback)
 *  - flexible (vignette + category)
 *  - ordre par date DESC
 * =============================== */
export const getAllProjectsQuery = `
  query GetAllProjects {
    projects(
      first: 100
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      nodes {
        title
        slug
        excerpt

        # 1) Vignette native WordPress
        featuredImage {
          node { id title mediaItemUrl sourceUrl mimeType }
        }

        # 2) Ancien groupe (fallback)
        projectFields {
          category
          subtitle
          description
          external_link
          playerAudio
          videoFullscreen
          mainImage {
            node { id title mediaItemUrl mimeType }
          }
          gallery {
            nodes { id title mediaItemUrl mimeType }
          }
        }

        # 3) Flexible (vignette + category)
        projectFieldsFlexible {
          category
          contentBlocks {
            __typename
            ... on ProjectFieldsFlexibleContentBlocksVideoBlockLayout {
              poster { node { id title mediaItemUrl mimeType } }
            }
            ... on ProjectFieldsFlexibleContentBlocksImageBlockLayout {
              image { node { id title mediaItemUrl mimeType } }
            }
            ... on ProjectFieldsFlexibleContentBlocksGalleryBlockLayout {
              images { nodes { id title mediaItemUrl mimeType } }
            }
          }
        }
      }
    }
  }
`;

/** ===============================
 *  SLUGS — Pour génération statique
 * =============================== */
export const getAllProjectSlugsQuery = `
  query GetAllProjectSlugs {
    projects(first: 100, where: { status: PUBLISH }) {
      nodes { slug }
    }
  }
`;

/** ===============================
 *  DÉTAIL — Page projet [slug]
 *  - featuredImage
 *  - ancien ACF (fallback)
 *  - flexible (complet)
 * =============================== */
export const getProjectBySlugQuery = `
  query GetProjectBySlug($slug: ID!) {
    project(id: $slug, idType: SLUG) {
      title
      slug
      excerpt

      featuredImage {
        node { id title mediaItemUrl sourceUrl mimeType }
      }

      # Ancien groupe (fallback)
      projectFields {
        subtitle
        category
        description
        external_link
        playerAudio
        videoFullscreen
        mainImage { node { id title mediaItemUrl mimeType } }
        gallery  { nodes { id title mediaItemUrl mimeType } }
      }

      # Nouveau groupe Flexible
      projectFieldsFlexible {
        category
        contentBlocks {
          __typename

          ... on ProjectFieldsFlexibleContentBlocksVideoBlockLayout {
            providerUrl
            autoplay
            loop
            muted
            controls
            poster { node { id title mediaItemUrl mimeType } }
          }

          ... on ProjectFieldsFlexibleContentBlocksTextBlockLayout {
            content
          }

          ... on ProjectFieldsFlexibleContentBlocksImageBlockLayout {
            image   { node { id title mediaItemUrl mimeType } }
            caption
          }

          ... on ProjectFieldsFlexibleContentBlocksAudioBlockLayout {
            title
            fileUrl
          }

          ... on ProjectFieldsFlexibleContentBlocksExternalLinkBlockLayout {
            label
            url
          }

          ... on ProjectFieldsFlexibleContentBlocksGalleryBlockLayout {
            images { nodes { id title mediaItemUrl mimeType } }
          }
        }
      }
    }
  }
`;

/** ==================================================
 *  ARCHIVE — Liste scrolable avec visuel en fond
 *  - on saute les 4 derniers projets (offset=4)
 *  - ordre par date DESC
 *
 *  ⚠️ Si "offsetPagination" n'est pas activé côté WPGraphQL,
 *     fais un slice côté JS: `projects.nodes.slice(4)`
 * ================================================== */
export const getArchiveProjectsQuery = `
  query GetArchiveProjects {
    projects(
      first: 100
      where: {
        status: PUBLISH
        orderby: { field: DATE, order: DESC }
        offsetPagination: { offset: 4 }
      }
    ) {
      nodes {
        title
        slug
        date

        featuredImage {
          node { id title mimeType mediaItemUrl sourceUrl }
        }

        projectFields {
          category
          videoFullscreen
          mainImage { node { id title mimeType mediaItemUrl } }
        }

        projectFieldsFlexible {
          category
          contentBlocks {
            __typename
            ... on ProjectFieldsFlexibleContentBlocksVideoBlockLayout {
              poster { node { id title mimeType mediaItemUrl } }
            }
            ... on ProjectFieldsFlexibleContentBlocksImageBlockLayout {
              image  { node { id title mimeType mediaItemUrl } }
            }
          }
        }
      }
    }
  }
`;
