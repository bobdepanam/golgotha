export const getAllProjectsQuery = `
  query GetAllProjects {
    projects(first: 100) {
      nodes {
        title
        slug
        excerpt
        projectFields {
          category
          subtitle
          description
          external_link
          playerAudio             # ✅ Ajouté
          videoFullscreen         # ✅ Ajouté
          mainImage {
            node {
              mediaItemUrl
              title
              id
              mimeType
            }
          }
          gallery {
            nodes {
              id
              mediaItemUrl
              title
              mimeType
            }
          }
        }
      }
    }
  }
`;

export const getAllProjectSlugsQuery = `
  query GetAllProjectSlugs {
    projects(first: 100) {
      nodes {
        slug
      }
    }
  }
`;

export const getProjectBySlugQuery = `
  query GetProjectBySlug($slug: ID!) {
    project(id: $slug, idType: SLUG) {
      title
      slug
      excerpt
      projectFields {
        subtitle
        category
        description
        external_link
        playerAudio
        videoFullscreen
        mainImage {
          node {
            mediaItemUrl
            title
            id
            mimeType
          }
        }
        gallery {
          nodes {
            id
            mediaItemUrl
            title
            mimeType
          }
        }
      }
    }
  }
`;
