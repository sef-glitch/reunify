import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all user data - cascading will handle related records
    // This will delete:
    // - cases (and cascading to plan_items and uploads)
    // - saved_resources
    await sql`
      DELETE FROM cases 
      WHERE user_id = ${session.user.id}
    `;

    await sql`
      DELETE FROM saved_resources 
      WHERE user_id = ${session.user.id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting user data:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
