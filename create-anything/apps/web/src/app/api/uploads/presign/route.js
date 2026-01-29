import { json } from "@react-router/node";
import { requireUser } from "@/utils/auth.server";
import { env, isS3Configured } from "@/utils/env";
import { presignPut } from "@/utils/s3";
import { sanitizeFilename, validateUploadRequest } from "@/utils/uploadValidation";

export async function action({ request }) {
  const user = await requireUser(request);

  if (!isS3Configured()) {
    return json({ error: "storage not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "invalid json" }, { status: 400 });

  const { case_id, filename, mime_type, size_bytes, tag } = body;

  const v = validateUploadRequest({ case_id, filename, mime_type, size_bytes, tag });
  if (!v.ok) return json({ error: v.error }, { status: 400 });

  // storage key structure: users/user_id/cases/case_id/date/uuid-filename
  const safeName = sanitizeFilename(filename);
  const ymd = new Date().toISOString().slice(0, 10);
  const object_key = `users/${user.id}/cases/${case_id}/${ymd}/${crypto.randomUUID()}-${safeName}`;

  const upload_url = await presignPut({
    bucket: env.S3_BUCKET,
    key: object_key,
    contentType: mime_type,
  });

  const publicBase = env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "");
  const file_url = `${publicBase}/${object_key}`;

  return json({
    upload_url,
    file_url,
    object_key,
  });
}
