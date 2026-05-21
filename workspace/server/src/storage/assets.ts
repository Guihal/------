import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/usr/projects/Диплом/workspace/server/uploads";

const ALLOWED_MIME = new Set(["image/webp", "image/png"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface AssetResult {
  url: string;
  filename: string;
}

export async function saveAsset(
  file: File
): Promise<AssetResult | { error: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "Only webp and png images are allowed" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "File too large (max 5MB)" };
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.type === "image/webp" ? "webp" : "png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = join(UPLOAD_DIR, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(path, new Uint8Array(bytes));
  return { url: `/uploads/${filename}`, filename };
}

export async function removeAsset(filename: string): Promise<void> {
  const path = join(UPLOAD_DIR, filename);
  await unlink(path).catch(() => {});
}
