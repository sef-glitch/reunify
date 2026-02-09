import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

export function makeS3Client() {
  const config = {
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  };

  // Optional endpoint for R2 / S3-compatible
  if (env.S3_ENDPOINT) config.endpoint = env.S3_ENDPOINT;

  return new S3Client(config);
}

export async function presignPut({ bucket, key, contentType }) {
  const s3 = makeS3Client();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  // 5 minutes is enough; keep short
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
  return url;
}

export async function deleteObject({ bucket, key }) {
  const s3 = makeS3Client();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
