// lib/graphql/queries.ts

/** Liste des projets (card list)
 * - featuredImage (WP natif)
 * - ancien ACF (fallback)
 * - flexible (mini sélection pour choper une vignette + category)
 */
export const getAllProjectsQuery = `
  query GetAllProjects {
    projects(first: 100) {
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

/** Slugs pour la génération statique */
export const getAllProjectSlugsQuery = `
  query GetAllProjectSlugs {
    projects(first: 100) {
      nodes { slug }
    }
  }
`;

/** Détail d'un projet (page [slug])
 * - featuredImage
 * - ancien ACF (fallback)
 * - flexible complet (tous les blocs + category)
 */
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
