import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");

  try {
    let events;
    if (caseId) {
      events = await sql`
        SELECT * FROM case_events 
        WHERE case_id = ${caseId} 
        AND case_id IN (SELECT id FROM cases WHERE user_id = ${session.user.id})
        ORDER BY event_date ASC
      `;
    } else {
      events = await sql`
        SELECT e.*, c.title as case_title 
        FROM case_events e
        JOIN cases c ON e.case_id = c.id
        WHERE c.user_id = ${session.user.id}
        ORDER BY e.event_date ASC
      `;
    }
    return Response.json(events);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { case_id, event_type, event_date, description } = body;

  try {
    const [caseCheck] =
      await sql`SELECT id FROM cases WHERE id = ${case_id} AND user_id = ${session.user.id}`;
    if (!caseCheck)
      return Response.json({ error: "Case not found" }, { status: 404 });

    const [newEvent] = await sql`
      INSERT INTO case_events (case_id, event_type, event_date, description)
      VALUES (${case_id}, ${event_type}, ${event_date}, ${description})
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'event_created', 'event', ${newEvent.id})
    `;

    return Response.json(newEvent, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, event_type, event_date, description } = body;

  try {
    const [event] = await sql`
      SELECT e.id FROM case_events e
      JOIN cases c ON e.case_id = c.id
      WHERE e.id = ${id} AND c.user_id = ${session.user.id}
    `;
    if (!event)
      return Response.json({ error: "Event not found" }, { status: 404 });

    const [updatedEvent] = await sql`
      UPDATE case_events
      SET event_type = ${event_type}, event_date = ${event_date}, description = ${description}
      WHERE id = ${id}
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'event_updated', 'event', ${id})
    `;

    return Response.json(updatedEvent);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    const [event] = await sql`
      SELECT e.id FROM case_events e
      JOIN cases c ON e.case_id = c.id
      WHERE e.id = ${id} AND c.user_id = ${session.user.id}
    `;
    if (!event)
      return Response.json({ error: "Event not found" }, { status: 404 });

    await sql`DELETE FROM case_events WHERE id = ${id}`;

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'event_deleted', 'event', ${id})
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
