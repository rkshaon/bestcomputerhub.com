/**
 * Utility for client-side image cropping and resizing via HTML5 Canvas.
 */

export interface CropOptions {
  /** Crop origin X coordinate in original image pixels */
  cropX: number;
  /** Crop origin Y coordinate in original image pixels */
  cropY: number;
  /** Crop width/height in original image pixels (square 1:1) */
  cropSize: number;
  /** Maximum output dimension in pixels (default 500) */
  maxOutputSize?: number;
  /** Output MIME type (default 'image/jpeg') */
  mimeType?: string;
  /** Image quality between 0 and 1 (default 0.92) */
  quality?: number;
  /** Target file name for the generated File object */
  fileName?: string;
}

/**
 * Crops a 1:1 square region from an HTMLImageElement and resizes it to at most maxOutputSize (default 500px).
 * Returns a File object ready for multipart/form-data upload.
 */
export async function cropAndResizeSquareImage(
  imageSource: HTMLImageElement,
  options: CropOptions
): Promise<File> {
  const {
    cropX,
    cropY,
    cropSize,
    maxOutputSize = 500,
    mimeType = 'image/jpeg',
    quality = 0.92,
    fileName = 'cropped-product-image.jpg'
  } = options;

  if (!imageSource || !(imageSource instanceof HTMLImageElement)) {
    throw new Error('Invalid image source provided for cropping.');
  }

  const origWidth = imageSource.naturalWidth || imageSource.width;
  const origHeight = imageSource.naturalHeight || imageSource.height;

  if (!origWidth || !origHeight || origWidth <= 0 || origHeight <= 0) {
    throw new Error('Image dimensions are invalid or zero.');
  }

  // Ensure crop box stays within source bounds
  const safeCropSize = Math.max(1, Math.min(cropSize, origWidth, origHeight));
  const safeCropX = Math.max(0, Math.min(cropX, origWidth - safeCropSize));
  const safeCropY = Math.max(0, Math.min(cropY, origHeight - safeCropSize));

  // Determine output dimension (capped at maxOutputSize)
  const outputSize = Math.max(1, Math.min(maxOutputSize, safeCropSize));

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to obtain 2D rendering context for image crop.');
  }

  // Smooth scaling configuration
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw source crop rect into canvas
  ctx.drawImage(
    imageSource,
    safeCropX,
    safeCropY,
    safeCropSize,
    safeCropSize,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob from canvas.'));
          return;
        }
        const file = new File([blob], fileName, { type: mimeType });
        resolve(file);
      },
      mimeType,
      quality
    );
  });
}
