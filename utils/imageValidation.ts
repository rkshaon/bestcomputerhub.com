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
