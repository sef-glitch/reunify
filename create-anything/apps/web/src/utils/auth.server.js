import { auth } from "@/auth";
import { json } from "@react-router/node";

/**
 * Get the current session user, throwing a 401 response if not authenticated
 */
export async function requireUser(request) {
  const session = await auth();
  if (!session?.user) {
    throw json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user;
}

/**
 * Get the current session user, returning null if not authenticated
 */
export async function getUser(request) {
  const session = await auth();
  return session?.user ?? null;
}
