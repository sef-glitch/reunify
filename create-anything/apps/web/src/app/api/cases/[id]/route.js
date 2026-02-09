import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const [caseDetail] = await sql`
      SELECT * FROM cases 
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (!caseDetail) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    return Response.json(caseDetail);
  } catch (error) {
    console.error("Error fetching case:", error);
    return Response.json({ error: "Failed to fetch case" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const body = await request.json();
    const {
      title,
      state,
      county,
      case_type,
      status,
      next_hearing_date,
      notes,
    } = body;

    const [updatedCase] = await sql`
      UPDATE cases
      SET 
        title = ${title},
        state = ${state},
        county = ${county},
        case_type = ${case_type},
        status = ${status},
        next_hearing_date = ${next_hearing_date},
        notes = ${notes}
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!updatedCase) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'case_updated', 'case', ${id})
    `;

    return Response.json(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    return Response.json({ error: "Failed to update case" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const [deletedCase] = await sql`
      DELETE FROM cases
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (!deletedCase) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'case_deleted', 'case', ${id})
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting case:", error);
    return Response.json({ error: "Failed to delete case" }, { status: 500 });
  }
}
