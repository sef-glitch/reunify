import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const cases = await sql`
      SELECT * FROM cases 
      WHERE user_id = ${session.user.id} 
      ORDER BY created_at DESC
    `;
    return Response.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return Response.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

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

    // Validate required fields
    if (!title || !state) {
      return Response.json(
        { error: "Title and State are required" },
        { status: 400 },
      );
    }

    // Start transaction
    const [newCase] = await sql.transaction(async (txn) => {
      const [createdCase] = await txn`
        INSERT INTO cases (user_id, title, state, county, case_type, status, next_hearing_date, notes)
        VALUES (${session.user.id}, ${title}, ${state}, ${county}, ${case_type}, ${status || "Active"}, ${next_hearing_date || null}, ${notes || ""})
        RETURNING *
      `;

      // Baseline Tasks
      const baselineTasks = [
        { title: "Write a case summary", days: 3 },
        { title: "List all upcoming deadlines and hearings", days: 3 },
        {
          title: "Collect key documents (court orders, service plan, notices)",
          days: 7,
        },
        { title: "Confirm required services/classes and providers", days: 7 },
        { title: "Create a communication log template", days: 7 },
      ];

      for (const task of baselineTasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.days);
        const formattedDate = dueDate.toISOString().split("T")[0];

        await txn`
          INSERT INTO tasks (case_id, title, priority, status, due_date)
          VALUES (${createdCase.id}, ${task.title}, 'Medium', 'not_started', ${formattedDate})
        `;

        await txn`
          INSERT INTO audit_log (user_id, action, entity_type, entity_id)
          VALUES (${session.user.id}, 'task_created', 'task', 'auto-generated')
        `;
      }

      await txn`
        INSERT INTO audit_log (user_id, action, entity_type, entity_id)
        VALUES (${session.user.id}, 'case_created', 'case', ${createdCase.id})
      `;

      return [createdCase];
    });

    return Response.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating case:", error);
    return Response.json({ error: "Failed to create case" }, { status: 500 });
  }
}
