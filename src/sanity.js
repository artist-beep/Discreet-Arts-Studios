const SANITY_PROJECT_ID = "2sw58gft";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2024-01-01";

const GROQ_QUERY = encodeURIComponent(`{
  "projects": *[_type == "portfolioWork"] | order(sortOrder asc, _createdAt asc) {
    "id": coalesce(slug.current, _id),
    name,
    "slug": coalesce(slug.current, _id),
    sector,
    workStatus,
    "type": coalesce(projectType, sector + " concept"),
    description,
    aspect,
    "images": images[] {
      "url": asset->url,
      "alt": coalesce(alt, "")
    },
    "partnerIds": coalesce(partners[]->_id, [])
  },
  "partners": *[_type == "studioPartner"] | order(sortOrder asc, _createdAt asc) {
    "id": _id,
    name,
    role,
    bio
  }
}`);

export async function fetchSanityContent() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${GROQ_QUERY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sanity query failed");
  const data = await res.json();
  return data.result;
}

