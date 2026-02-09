import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    // Check DB connection
    const timeResult = await sql`SELECT NOW() as now`;

    // Check required tables - doing them one by one to avoid dynamic table names if unsupported
    let casesCount, templatesCount, itemsCount;

    try {
      const res = await sql`SELECT count(*) as count FROM cases`;
      casesCount = res[0].count;
    } catch (e) {
      casesCount = "error: " + e.message;
    }

    try {
      const res = await sql`SELECT count(*) as count FROM plan_templates`;
      templatesCount = res[0].count;
    } catch (e) {
      templatesCount = "error: " + e.message;
    }

    try {
      const res = await sql`SELECT count(*) as count FROM plan_items`;
      itemsCount = res[0].count;
    } catch (e) {
      itemsCount = "error: " + e.message;
    }

    return Response.json({
      status: "connected",
      timestamp: timeResult[0].now,
      tables: {
        cases: casesCount,
        plan_templates: templatesCount,
        plan_items: itemsCount,
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        error: "Database check failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
