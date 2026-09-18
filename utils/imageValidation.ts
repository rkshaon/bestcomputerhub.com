/**
 * Utility functions for image dimension, aspect ratio, and resolution validation.
 */

/**
 * Checks if an image has a non-1:1 aspect ratio.
 * Returns false if dimensions are missing, null, non-positive, or invalid.
 *
 * @param width - The width of the image in pixels
 * @param height - The height of the image in pixels
 * @returns True if width and height are valid positive numbers and width !== height
 */
export function isNonSquareAspect(
  width?: number | null,
  height?: number | null
): boolean {
  if (width === undefined || width === null || height === undefined || height === null) {
    return false;
  }
  if (typeof width !== 'number' || typeof height !== 'number' || isNaN(width) || isNaN(height)) {
    return false;
  }
  if (width <= 0 || height <= 0) {
    return false;
  }
  return width !== height;
}

/**
 * Checks if either image width or height exceeds the maximum resolution threshold.
 * Returns false if dimensions are missing, null, non-positive, or invalid.
 *
 * @param width - The width of the image in pixels
 * @param height - The height of the image in pixels
 * @param maxDimension - The threshold in pixels (defaults to 500)
 * @returns True if either valid width or height is greater than maxDimension
 */
export function isExceedingResolution(
  width?: number | null,
  height?: number | null,
  maxDimension: number = 500
): boolean {
  if (width === undefined || width === null || height === undefined || height === null) {
    return false;
  }
  if (typeof width !== 'number' || typeof height !== 'number' || isNaN(width) || isNaN(height)) {
    return false;
  }
  if (width <= 0 || height <= 0) {
    return false;
  }
  return width > maxDimension || height > maxDimension;
}

export interface IconValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
}

/**
 * Validates a category featured icon file against requirements:
 * - Allowed formats: PNG, WebP, SVG
 * - Max file size: 100KB
 * - Dimensions: PNG and WebP must be square and exactly 64x64 pixels.
 *
 * @param file - File object to validate
 * @returns Promise resolving to IconValidationResult
 */
export async function validateFeaturedCategoryIcon(file: File): Promise<IconValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  const isPng = fileType === 'image/png' || fileName.endsWith('.png');
  const isWebp = fileType === 'image/webp' || fileName.endsWith('.webp');
  const isSvg = fileType === 'image/svg+xml' || fileName.endsWith('.svg');

  if (!isPng && !isWebp && !isSvg) {
    return {
      valid: false,
      error: 'Invalid file format. Only PNG, WebP, and SVG files are allowed.'
    };
  }

  // Max size: 100KB (102,400 bytes)
  const MAX_SIZE_BYTES = 100 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    const actualKb = (file.size / 1024).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds the 100KB limit (current size: ${actualKb}KB).`
    };
  }

  // For vector SVG, size check is sufficient
  if (isSvg) {
    return { valid: true };
  }

  // For PNG and WebP, check dimensions (must be 64x64 and square)
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);

      if (width !== height) {
        resolve({
          valid: false,
          error: `Featured icon must be square (current dimensions: ${width}x${height}px).`,
          width,
          height
        });
        return;
      }

      if (width !== 64 || height !== 64) {
        resolve({
          valid: false,
          error: `PNG and WebP icons must be exactly 64x64 pixels (current dimensions: ${width}x${height}px).`,
          width,
          height
        });
        return;
      }

      resolve({ valid: true, width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to inspect image dimensions. The file may be corrupt or unreadable.'
      });
    };

    img.src = objectUrl;
  });
}
