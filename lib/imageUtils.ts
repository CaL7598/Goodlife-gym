/**
 * Resize an image before converting to base64.
 * Reduces storage, bandwidth, and load times - especially important when
 * many images are stored in the database (e.g. member photos).
 *
 * Uses Canvas API - no external dependencies, works in all modern browsers.
 */

const DEFAULT_MAX_SIZE = 400; // pixels - good for profile avatars (displayed ~80-96px)
const JPEG_QUALITY = 0.85; // Balance between quality and file size

/**
 * Resize an image file and return as base64 data URL.
 * Maintains aspect ratio. Output is JPEG for smaller file size.
 *
 * @param file - The image file from input
 * @param maxWidth - Max width in pixels (default 400)
 * @param maxHeight - Max height in pixels (default 400)
 * @returns Promise<string> - data URL (e.g. "data:image/jpeg;base64,...")
 */
export async function resizeImageForUpload(
  file: File,
  maxWidth: number = DEFAULT_MAX_SIZE,
  maxHeight: number = DEFAULT_MAX_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // Scale down if needed, never upscale (ratio max 1)
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio) || 1;
      height = Math.round(height * ratio) || 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG for smaller size (profile photos rarely need transparency)
      const mime = 'image/jpeg';

      try {
        const dataUrl = canvas.toDataURL(mime, JPEG_QUALITY);
        resolve(dataUrl);
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to encode image'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resize an existing base64 image (e.g. from database).
 * Use for migrating/batch-resizing member photos already stored.
 *
 * @param dataUrl - Base64 data URL (e.g. "data:image/jpeg;base64,...")
 * @param maxWidth - Max width in pixels (default 400)
 * @param maxHeight - Max height in pixels (default 400)
 * @returns Promise<string> - resized data URL
 */
export async function resizeBase64Image(
  dataUrl: string,
  maxWidth: number = DEFAULT_MAX_SIZE,
  maxHeight: number = DEFAULT_MAX_SIZE
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    throw new Error('Invalid image data URL');
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio) || 1;
      height = Math.round(height * ratio) || 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to encode image'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}
