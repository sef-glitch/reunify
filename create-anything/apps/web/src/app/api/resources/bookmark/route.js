import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await request.json();
    if (!resourceId) {
      return Response.json({ error: "Resource ID required" }, { status: 400 });
    }

    // Check if exists
    const existing = await sql`
      SELECT id FROM saved_resources 
      WHERE user_id = ${session.user.id} AND resource_id = ${resourceId}
    `;

    let saved = false;

    if (existing.length > 0) {
      // Delete
      await sql`
        DELETE FROM saved_resources 
        WHERE user_id = ${session.user.id} AND resource_id = ${resourceId}
      `;
      saved = false;
    } else {
      // Insert
      await sql`
        INSERT INTO saved_resources (user_id, resource_id) 
        VALUES (${session.user.id}, ${resourceId})
      `;
      saved = true;
    }

    return Response.json({ saved });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
