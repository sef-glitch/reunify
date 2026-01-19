import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    const cookieHeader = request.headers.get("cookie");

    return Response.json({
      authenticated: !!session?.user,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      cookiesPresent: !!cookieHeader,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to check auth status",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
