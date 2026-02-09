const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TAGS = new Set([
  "court_docs",
  "services",
  "drug_screens",
  "housing",
  "employment",
  "visitation",
  "other",
]);

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateUploadRequest({ case_id, filename, mime_type, size_bytes, tag }) {
  if (!case_id) return { ok: false, error: "case_id is required" };
  if (!filename) return { ok: false, error: "filename is required" };
  if (!mime_type) return { ok: false, error: "mime_type is required" };
  if (!Number.isFinite(size_bytes) || size_bytes <= 0) return { ok: false, error: "size_bytes must be a positive number" };
  if (size_bytes > MAX_BYTES) return { ok: false, error: "file too large (max 10MB)" };
  if (!tag || !ALLOWED_TAGS.has(tag)) return { ok: false, error: "invalid tag" };
  if (!ALLOWED_MIME.has(mime_type)) return { ok: false, error: "invalid mime_type" };

  return { ok: true };
}

export function sanitizeFilename(name) {
  // keep it simple and safe
  return String(name)
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 120);
}
