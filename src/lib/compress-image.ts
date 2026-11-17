/**
 * Browser-only: shrink a CV photo before upload. Phone camera photos are often
 * 3–8 MB; resizing the longest side to 2400px as JPEG keeps text readable while
 * landing well under the upload limit (usually < 1 MB).
 * Returns the original file if it can't be decoded (e.g. HEIC on some browsers).
 */
export async function compressImage(file: File, maxSide = 2400, quality = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  // Small images don't need work.
  if (file.size < 700 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // flatten transparent PNGs onto white
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "cv-photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
