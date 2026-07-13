import imageCompression from "browser-image-compression";

/**
 * Downscale + re-encode an image to fit under the target size, preserving
 * the original filename. Non-images (PDF, ZIP, RAR, GIF) and images already
 * under the threshold are returned unchanged.
 *
 * Used by any attachment picker in the app (create-ticket, reply-box,
 * customer-side inline reply) so the compression behavior stays consistent
 * across every upload point.
 *
 * @param file  Input File
 * @returns     A possibly-smaller File, or the original if compression was
 *              skipped, unhelpful, or errored.
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!shouldCompressImage(file)) return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,             // target ~500KB
      maxWidthOrHeight: 1920,     // cap for huge phone photos
      useWebWorker: true,         // keep UI responsive
      fileType: "image/jpeg",     // convert PNG → JPEG for real size gains
      initialQuality: 0.8,
    });
    // If compression didn't actually help, keep the original (rare but
    // possible for already-optimized inputs).
    if (compressed.size >= file.size) return file;

    // Force .jpg extension since output is JPEG. Preserves the original stem.
    const newName = replaceExtension(file.name, ".jpg");
    return new File([compressed], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error("Image compression failed for", file.name, err);
    return file;
  }
}

/** True when the file is a still image over the 500KB threshold. */
function shouldCompressImage(file: File): boolean {
  return (
    file.type.startsWith("image/") &&
    file.type !== "image/gif" && // re-encoding an animated GIF would lose animation
    file.size > 500 * 1024
  );
}

function replaceExtension(filename: string, newExt: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return filename + newExt;
  return filename.substring(0, lastDot) + newExt;
}
