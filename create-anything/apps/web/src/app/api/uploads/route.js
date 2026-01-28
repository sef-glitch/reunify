import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Allowed document tags/categories
const ALLOWED_TAGS = [
  "court_docs",
  "services",
  "drug_screens",
  "housing",
  "employment",
  "visitation",
  "other",
];

// Max file size: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return Response.json({ error: "caseId is required" }, { status: 400 });
    }

    // Verify ownership
    const cases = await sql`
      SELECT id FROM cases 
      WHERE id = ${caseId} AND user_id = ${session.user.id}
    `;

    if (cases.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const rows = await sql`
      SELECT * FROM uploads 
      WHERE case_id = ${caseId} 
      ORDER BY created_at DESC
    `;

    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { case_id, plan_item_id, file_url, tag, file_size, mime_type } = body;

    // Validate required fields
    if (!case_id) {
      return Response.json({ error: "case_id is required" }, { status: 400 });
    }

    if (!file_url) {
      return Response.json({ error: "file_url is required" }, { status: 400 });
    }

    // Validate file_url format
    try {
      new URL(file_url);
    } catch {
      return Response.json({ error: "Invalid file_url format" }, { status: 400 });
    }

    // Validate tag if provided
    if (tag && !ALLOWED_TAGS.includes(tag)) {
      return Response.json(
        { error: `Invalid tag. Allowed values: ${ALLOWED_TAGS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size if provided
    if (file_size !== undefined && file_size !== null) {
      if (typeof file_size !== "number" || file_size <= 0) {
        return Response.json({ error: "Invalid file_size" }, { status: 400 });
      }
      if (file_size > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: `File size exceeds maximum allowed (${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)` },
          { status: 400 }
        );
      }
    }

    // Validate MIME type if provided
    if (mime_type && !ALLOWED_MIME_TYPES.includes(mime_type)) {
      return Response.json(
        { error: `File type not allowed. Allowed types: PDF, images (JPEG, PNG, GIF, WebP), Word documents` },
        { status: 400 }
      );
    }

    // Verify ownership
    const cases = await sql`
      SELECT id FROM cases
      WHERE id = ${case_id} AND user_id = ${session.user.id}
    `;

    if (cases.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const rows = await sql`
      INSERT INTO uploads (case_id, plan_item_id, file_url, tag)
      VALUES (${case_id}, ${plan_item_id}, ${file_url}, ${tag})
      RETURNING *
    `;

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error creating upload:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Upload ID is required" }, { status: 400 });
    }

    // Verify ownership and delete
    const result = await sql`
      DELETE FROM uploads 
      WHERE id = ${id} 
      AND case_id IN (SELECT id FROM cases WHERE user_id = ${session.user.id})
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Upload not found or unauthorized" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting upload:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
