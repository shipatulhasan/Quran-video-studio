import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT ?? process.env.AWS_ENDPOINT_URL_S3;

export function isObjectStorageConfigured() {
  return Boolean(
    bucket &&
      (process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID) &&
      (process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY),
  );
}

function client() {
  if (!isObjectStorageConfigured() || !bucket) throw new Error("Object storage is not configured");
  return new S3Client({
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "auto",
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function objectKey(projectId: string, filename: string) {
  return `projects/${projectId}/${filename}`;
}

export function storageRef(key: string) {
  return `storage://${key}`;
}

export function isStorageRef(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith("storage://"));
}

export function keyFromRef(ref: string) {
  return ref.replace(/^storage:\/\//, "");
}

export async function uploadFile(filePath: string, key: string, contentType?: string) {
  try {
    await client().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ...(contentType ? { ContentType: contentType } : {}),
    }));
  } catch (error) {
    const code = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (code === "NoSuchBucket") {
      throw new Error(`Configured object-storage bucket does not exist: ${bucket}. Create it in Neon or set S3_BUCKET to an existing bucket.`);
    }
    throw error;
  }
  return storageRef(key);
}

export async function downloadFile(ref: string, filePath: string) {
  const response = await client().send(new GetObjectCommand({ Bucket: bucket, Key: keyFromRef(ref) }));
  if (!response.Body) throw new Error("Object storage returned an empty file");
  const bytes = await response.Body.transformToByteArray();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
}

export async function signedStorageUrl(ref: string, expiresIn = 3600) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket, Key: keyFromRef(ref) }), { expiresIn });
}

export async function publicUrl(ref: string | null | undefined) {
  if (!ref) return null;
  return isStorageRef(ref) ? signedStorageUrl(ref) : ref;
}
