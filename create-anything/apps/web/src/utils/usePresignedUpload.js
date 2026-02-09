import { useState, useCallback } from "react";

/**
 * Hook for uploading files using presigned URLs
 * Works with S3-compatible storage (AWS S3, Cloudflare R2, etc.)
 */
export function usePresignedUpload() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async ({ file, caseId, tag }) => {
    if (!file) {
      return { error: "No file provided" };
    }

    if (!caseId) {
      return { error: "Case ID is required" };
    }

    setLoading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned URL from our API
      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          tag: tag,
        }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { upload_url, file_url, object_key } = await presignResponse.json();

      setProgress(10);

      // Step 2: Upload file directly to S3 using presigned URL
      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setProgress(100);

      return {
        url: file_url,
        objectKey: object_key,
        mimeType: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error("Presigned upload error:", error);
      return { error: error.message || "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading, progress }];
}

export default usePresignedUpload;
