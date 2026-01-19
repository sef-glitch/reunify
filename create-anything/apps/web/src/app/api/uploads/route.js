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

    // Verify ownership
    const cases = await sql`
      SELECT id FROM cases 
      WHERE id = ${caseId} AND user_id = ${session.user.id}
    `;

    if (cases.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const rows = await sql`
      SELECT * FROM uploads 
      WHERE case_id = ${caseId} 
      ORDER BY created_at DESC
    `;

    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { case_id, plan_item_id, file_url, tag } = body;

    // Verify ownership
    const cases = await sql`
      SELECT id FROM cases 
      WHERE id = ${case_id} AND user_id = ${session.user.id}
    `;

    if (cases.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const rows = await sql`
      INSERT INTO uploads (case_id, plan_item_id, file_url, tag)
      VALUES (${case_id}, ${plan_item_id}, ${file_url}, ${tag})
      RETURNING *
    `;

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error creating upload:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Upload ID is required" }, { status: 400 });
    }

    // Verify ownership and delete
    const result = await sql`
      DELETE FROM uploads 
      WHERE id = ${id} 
      AND case_id IN (SELECT id FROM cases WHERE user_id = ${session.user.id})
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Upload not found or unauthorized" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting upload:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
