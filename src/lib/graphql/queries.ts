// lib/graphql/queries.ts

/** -------- Fragments communs (réutilisables) -------- */
export const MEDIA_FIELDS = /* GraphQL */ `
  fragment MediaFields on MediaItem {
    id
    title
    mimeType
    mediaItemUrl        # original brut (fallback legacy)
    sourceUrl           # URL "par défaut" côté WP
    mediaDetails {
      width
      height
      sizes {
        name            # e.g. thumbnail, medium, large, 1536x1536, 2048x2048...
        sourceUrl       # URL de la taille dérivée (souvent .webp après EWWW)
        width
        height
      }
    }
    # Optionnel : accès direct à une taille connue côté WP
    large: sourceUrl(size: LARGE)
    x1536: sourceUrl(size: _1536X1536)
    x2048: sourceUrl(size: _2048X2048)
  }
`;

/** ===============================
 *  LISTE — Tous les projets (cards)
 * =============================== */
export const getAllProjectsQuery = /* GraphQL */ `
  ${MEDIA_FIELDS}
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
          node { ...MediaFields }
        }

        # 2) Ancien groupe (fallback)
        projectFields {
          category
          subtitle
          description
          external_link
          playerAudio
          videoFullscreen
          mainImage { node { ...MediaFields } }
          gallery  { nodes { ...MediaFields } }
        }

        # 3) Flexible (vignette + category)
        projectFieldsFlexible {
          category
          contentBlocks {
            __typename
            ... on ProjectFieldsFlexibleContentBlocksVideoBlockLayout {
              poster { node { ...MediaFields } }
            }
            ... on ProjectFieldsFlexibleContentBlocksImageBlockLayout {
              image { node { ...MediaFields } }
            }
            ... on ProjectFieldsFlexibleContentBlocksGalleryBlockLayout {
              images { nodes { ...MediaFields } }
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
export const getAllProjectSlugsQuery = /* GraphQL */ `
  query GetAllProjectSlugs {
    projects(first: 100, where: { status: PUBLISH }) {
      nodes { slug }
    }
  }
`;

/** ===============================
 *  DÉTAIL — Page projet [slug]
 * =============================== */
export const getProjectBySlugQuery = /* GraphQL */ `
  ${MEDIA_FIELDS}
  query GetProjectBySlug($slug: ID!) {
    project(id: $slug, idType: SLUG) {
      title
      slug
      excerpt

      featuredImage { node { ...MediaFields } }

      # Ancien groupe (fallback)
      projectFields {
        subtitle
        category
        description
        external_link
        playerAudio
        videoFullscreen
        mainImage { node { ...MediaFields } }
        gallery  { nodes { ...MediaFields } }
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
            poster { node { ...MediaFields } }
          }

          ... on ProjectFieldsFlexibleContentBlocksTextBlockLayout {
            content
          }

          ... on ProjectFieldsFlexibleContentBlocksImageBlockLayout {
            image   { node { ...MediaFields } }
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
            images { nodes { ...MediaFields } }
          }
        }
      }

      # Yoast SEO (pour generateMetadata)
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
        opengraphImage { mediaItemUrl }   # tu gardes tel quel, on peut aussi lui appliquer ...MediaFields si besoin
        twitterTitle
        twitterDescription
        twitterImage { mediaItemUrl }
      }
      # ou yoast_head_json selon ton implémentation
    }
  }
`;

/** ==================================================
 *  ARCHIVE — Liste scrollable avec visuel en fond
 * ================================================== */
export const getArchiveProjectsQuery = /* GraphQL */ `
  ${MEDIA_FIELDS}
  query GetArchiveProjects {
    projects(
      first: 100
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      nodes {
        title
        slug
        date

        featuredImage { node { ...MediaFields } }

        projectFields {
          category
          videoFullscreen
          mainImage { node { ...MediaFields } }
        }

        projectFieldsFlexible {
          category
          contentBlocks {
            __typename
            ... on ProjectFieldsFlexibleContentBlocksVideoBlockLayout {
              poster { node { ...MediaFields } }
            }
            ... on ProjectFieldsFlexibleContentBlocksImageBlockLayout {
              image  { node { ...MediaFields } }
            }
            ... on ProjectFieldsFlexibleContentBlocksGalleryBlockLayout {
              images { nodes { ...MediaFields } }
            }
          }
        }
      }
    }
  }
`;
