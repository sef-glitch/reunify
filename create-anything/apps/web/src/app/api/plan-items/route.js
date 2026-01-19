import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return Response.json({ error: "caseId is required" }, { status: 400 });
    }

    // Verify ownership of the case
    const cases = await sql`
      SELECT id FROM cases 
      WHERE id = ${caseId} AND user_id = ${session.user.id}
    `;

    if (cases.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const items = await sql`
      SELECT * FROM plan_items 
      WHERE case_id = ${caseId}
      ORDER BY id ASC
    `;

    return Response.json(items);
  } catch (error) {
    console.error("Error fetching plan items:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Verify ownership via join
    const ownership = await sql`
      SELECT p.id 
      FROM plan_items p
      JOIN cases c ON p.case_id = c.id
      WHERE p.id = ${id} AND c.user_id = ${session.user.id}
    `;

    if (ownership.length === 0) {
      return Response.json(
        { error: "Item not found or unauthorized" },
        { status: 403 },
      );
    }

    const rows = await sql`
      UPDATE plan_items 
      SET status = ${status}, updated_at = now()
      WHERE id = ${id} 
      RETURNING *
    `;

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error updating plan item:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
