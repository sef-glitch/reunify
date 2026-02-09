import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const category = url.searchParams.get("category");

  try {
    let resources;
    if (state && category) {
      resources = await sql`
        SELECT * FROM resources WHERE state = ${state} AND category = ${category} ORDER BY name
      `;
    } else if (state) {
      resources = await sql`
        SELECT * FROM resources WHERE state = ${state} ORDER BY name
      `;
    } else if (category) {
      resources = await sql`
        SELECT * FROM resources WHERE category = ${category} ORDER BY name
      `;
    } else {
      resources = await sql`
        SELECT * FROM resources ORDER BY state, name LIMIT 100
      `;
    }
    return Response.json(resources);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}
