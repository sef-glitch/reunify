import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const session = await auth();

    console.log(
      "Test endpoint - Session:",
      session ? "authenticated" : "not authenticated",
    );

    if (!session || !session.user) {
      return Response.json(
        {
          error: "Unauthorized",
          authenticated: false,
        },
        { status: 401 },
      );
    }

    // Test database connection
    const testQuery = await sql`SELECT 1 as test`;
    console.log("Test query result:", testQuery);

    // Check plan_templates
    const templateCount =
      await sql`SELECT COUNT(*) as count FROM plan_templates`;
    console.log("Template count:", templateCount);

    // Get sample templates
    const sampleTemplates = await sql`
      SELECT stage, risk, COUNT(*) as count 
      FROM plan_templates 
      GROUP BY stage, risk 
      ORDER BY stage, risk
      LIMIT 10
    `;
    console.log("Sample templates:", sampleTemplates);

    // Test array parameter
    const testArray = ["Housing", "Employment"];
    const arrayTest = await sql`
      SELECT * FROM plan_templates 
      WHERE stage = ${"Services Plan"} AND risk = ANY(${testArray})
      LIMIT 5
    `;
    console.log("Array test result:", arrayTest);

    return Response.json({
      success: true,
      user: session.user,
      database_connection: "OK",
      template_count: templateCount[0]?.count || 0,
      sample_templates: sampleTemplates,
      array_test: arrayTest,
      message: "All tests passed",
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    console.error("Error stack:", error.stack);
    return Response.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
