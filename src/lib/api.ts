const WP_API_URL = process.env.NEXT_PUBLIC_WP_API || "https://cms.bastardz.fr/graphql";

export async function fetchGraphQL(query: string, variables = {}) {
  const res = await fetch(WP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // ISR : revalidation toutes les 60s
  });

  const json = await res.json();

  if (json.errors) {
    console.warn("GraphQL a retourné des erreurs :", json.errors);
    return { data: null };
  }

  return json.data;
}
