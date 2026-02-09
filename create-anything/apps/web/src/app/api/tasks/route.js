import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");

  try {
    let tasks;
    if (caseId) {
      tasks = await sql`
        SELECT * FROM tasks 
        WHERE case_id = ${caseId} 
        AND case_id IN (SELECT id FROM cases WHERE user_id = ${session.user.id})
        ORDER BY due_date ASC
      `;
    } else {
      tasks = await sql`
        SELECT t.*, c.title as case_title 
        FROM tasks t
        JOIN cases c ON t.case_id = c.id
        WHERE c.user_id = ${session.user.id}
        ORDER BY t.due_date ASC
      `;
    }
    return Response.json(tasks);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { case_id, title, description, notes, due_date, priority, status } = body;

  try {
    const [caseCheck] =
      await sql`SELECT id FROM cases WHERE id = ${case_id} AND user_id = ${session.user.id}`;
    if (!caseCheck)
      return Response.json({ error: "Case not found" }, { status: 404 });

    const [newTask] = await sql`
      INSERT INTO tasks (case_id, title, description, notes, due_date, priority, status)
      VALUES (${case_id}, ${title}, ${description}, ${notes || null}, ${due_date}, ${priority || "Medium"}, ${status || "not_started"})
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'task_created', 'task', ${newTask.id})
    `;

    return Response.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, title, description, notes, due_date, priority, status } = body;

  try {
    const [task] = await sql`
      SELECT t.id FROM tasks t
      JOIN cases c ON t.case_id = c.id
      WHERE t.id = ${id} AND c.user_id = ${session.user.id}
    `;
    if (!task)
      return Response.json({ error: "Task not found" }, { status: 404 });

    const [updatedTask] = await sql`
      UPDATE tasks
      SET title = ${title}, description = ${description}, notes = ${notes}, due_date = ${due_date}, priority = ${priority}, status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'task_updated', 'task', ${id})
    `;

    return Response.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    const [task] = await sql`
      SELECT t.id FROM tasks t
      JOIN cases c ON t.case_id = c.id
      WHERE t.id = ${id} AND c.user_id = ${session.user.id}
    `;
    if (!task)
      return Response.json({ error: "Task not found" }, { status: 404 });

    await sql`DELETE FROM tasks WHERE id = ${id}`;

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id)
      VALUES (${session.user.id}, 'task_deleted', 'task', ${id})
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
