import { auth } from "@/auth";
import { env, isS3Configured } from "@/utils/env";
import { presignPut } from "@/utils/s3";
import { sanitizeFilename, validateUploadRequest } from "@/utils/uploadValidation";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isS3Configured()) {
    return Response.json({ error: "storage not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { case_id, filename, mime_type, size_bytes, tag } = body;

  const v = validateUploadRequest({ case_id, filename, mime_type, size_bytes, tag });
  if (!v.ok) {
    return Response.json({ error: v.error }, { status: 400 });
  }

  // storage key structure: users/user_id/cases/case_id/date/uuid-filename
  const safeName = sanitizeFilename(filename);
  const ymd = new Date().toISOString().slice(0, 10);
  const object_key = `users/${session.user.id}/cases/${case_id}/${ymd}/${crypto.randomUUID()}-${safeName}`;

  try {
    const upload_url = await presignPut({
      bucket: env.S3_BUCKET,
      key: object_key,
      contentType: mime_type,
    });

    const publicBase = env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "");
    const file_url = `${publicBase}/${object_key}`;

    return Response.json({
      upload_url,
      file_url,
      object_key,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return Response.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
