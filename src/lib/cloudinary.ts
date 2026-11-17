import "server-only";
import { Agent } from "node:https";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// Reuse TLS connections to Cloudinary between uploads on a warm server
// (a fresh connection costs about two extra seconds).
const keepAliveAgent = new Agent({ keepAlive: true, maxSockets: 10 });

let configured = false;

function client() {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary environment variables are not set.");
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

function uploadBuffer(buffer: Buffer, options: Record<string, unknown>) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client().uploader.upload_stream({ agent: keepAliveAgent, ...options }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Upload failed"));
      resolve(result);
    });
    stream.end(buffer);
  });
}

const CV_FOLDER = "tuition-teacher-pokhara/cvs";

/**
 * Upload a CV as a private ("authenticated") raw asset. Authenticated assets
 * cannot be fetched via their plain URL; access always goes through a
 * short-lived signed URL generated for a logged-in administrator.
 */
export async function uploadCv(buffer: Buffer, opts: { extension: string }) {
  const result = await uploadBuffer(buffer, {
    resource_type: "raw",
    type: "authenticated",
    folder: CV_FOLDER,
    // Raw assets keep the extension inside the public_id.
    public_id: `cv-${Date.now()}-${randomUUID().slice(0, 8)}.${opts.extension}`,
    overwrite: false,
    use_filename: false,
  });
  // Cloudinary returns a permanently *signed* delivery URL for authenticated
  // assets (".../s--SIGNATURE--/..."). Never store that: strip the signature so
  // the saved URL is only a reference. Access always goes through signedCvUrl().
  const url = result.secure_url.replace(/\/s--[^/]+--\//, "/");
  return { publicId: result.public_id, url, bytes: result.bytes };
}

export async function deleteCv(publicId: string) {
  await client().uploader.destroy(publicId, { resource_type: "raw", type: "authenticated", invalidate: true });
}

/** Short-lived (5 min) signed download URL for a private CV. */
export function signedCvUrl(publicId: string, opts: { attachment: boolean }) {
  return client().utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    attachment: opts.attachment,
  });
}

/** Agency logos are public brand assets. */
export async function uploadLogo(buffer: Buffer) {
  const result = await uploadBuffer(buffer, {
    resource_type: "image",
    folder: "tuition-teacher-pokhara/branding",
    public_id: `logo-${Date.now()}`,
  });
  return result.secure_url;
}
