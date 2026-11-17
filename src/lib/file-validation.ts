import { CV_ALLOWED, CV_MAX_BYTES, CV_MAX_LABEL, CV_TYPES_LABEL } from "./constants";

export type CvCheck = { ok: true; extension: string; mime: string } | { ok: false; error: string };

function extensionOf(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1]!.toLowerCase() : "";
}

/** Cheap client+server check on name, declared MIME type and size. */
export function checkCvMeta(file: { name: string; type: string; size: number }): CvCheck {
  const ext = extensionOf(file.name);
  if (!CV_ALLOWED[ext]) return { ok: false, error: `Only ${CV_TYPES_LABEL} files are allowed` };
  // Some mobile browsers send an empty or generic type; the server re-checks magic bytes.
  if (file.type && file.type !== "application/octet-stream" && !CV_ALLOWED[ext]!.includes(file.type)) {
    return { ok: false, error: "The file type does not match its extension" };
  }
  if (file.size <= 0) return { ok: false, error: "The selected file is empty" };
  if (file.size > CV_MAX_BYTES) return { ok: false, error: `File must be ${CV_MAX_LABEL} or smaller` };
  return { ok: true, extension: ext, mime: CV_ALLOWED[ext]![0]! };
}

/** Server-side content sniffing: verify the file's magic bytes match its extension. */
export function checkCvSignature(bytes: Uint8Array, extension: string) {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (extension) {
    case "pdf":
      return startsWith([0x25, 0x50, 0x44, 0x46]); // %PDF
    case "docx":
      return startsWith([0x50, 0x4b, 0x03, 0x04]); // ZIP container
    case "doc":
      return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // OLE2
    case "jpg":
    case "jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "webp":
      return startsWith([0x52, 0x49, 0x46, 0x46]) && [0x57, 0x45, 0x42, 0x50].every((b, i) => bytes[8 + i] === b); // RIFF....WEBP
    default:
      return false;
  }
}

/** Keep a safe, display-only version of the original filename. */
export function sanitizeFileName(name: string) {
  const cleaned = name
    .replace(/[\\/]/g, "_")
    .replace(/[^\p{L}\p{N}\s._()-]/gu, "")
    .trim()
    .slice(-150);
  return cleaned || "cv";
}
