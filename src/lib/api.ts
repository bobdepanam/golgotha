// src/lib/api.ts
const WP_API_URL = process.env.NEXT_PUBLIC_WP_API || "https://cms.bastardz.fr/graphql";

type FetchOptions = {
  revalidate?: number;
  tags?: string[];
};

export async function fetchGraphQL(
  query: string,
  variables: Record<string, unknown> = {},
  { revalidate = 60, tags = ["projects"] }: FetchOptions = {}
) {
  const res = await fetch(WP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    // ⬇️ Tag + ISR (permet revalidateTag("projects"))
    next: { revalidate, tags },
  });

  const json = await res.json();

  if (json.errors) {
    console.warn("GraphQL a retourné des erreurs :", json.errors);
    return { data: null };
  }

  return json.data;
}
