export function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function toStars(value: number | null | undefined) {
  if (value === null || value === undefined) return '☆☆☆☆☆';
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}

export function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

const PROFILE_IMAGE_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const PROFILE_IMAGE_MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const PROFILE_IMAGE_MAX_DIMENSION = 512;
const PROFILE_IMAGE_OUTPUT_TYPE = 'image/jpeg';
const PROFILE_IMAGE_OUTPUT_QUALITY = 0.86;
const PROFILE_IMAGE_MAX_PROCESSED_BYTES = 1_200_000;

function scaleDownDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('Failed to process selected image.'));
    }, type, quality);
  });
}

export async function processProfileImageFile(file: File) {
  if (!PROFILE_IMAGE_ALLOWED_TYPES.has(file.type)) {
    throw new Error('Please select a JPG, PNG, or WebP image.');
  }

  if (file.size > PROFILE_IMAGE_MAX_ORIGINAL_BYTES) {
    throw new Error('Image must be smaller than 10MB.');
  }

  const image = await loadImageFromFile(file);
  const targetSize = scaleDownDimensions(
    image.naturalWidth,
    image.naturalHeight,
    PROFILE_IMAGE_MAX_DIMENSION
  );

  const canvas = document.createElement('canvas');
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not process selected image.');
  }

  // JPEG does not support transparency; use white background for predictable avatars.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, targetSize.width, targetSize.height);
  context.drawImage(image, 0, 0, targetSize.width, targetSize.height);

  const blob = await canvasToBlob(
    canvas,
    PROFILE_IMAGE_OUTPUT_TYPE,
    PROFILE_IMAGE_OUTPUT_QUALITY
  );

  if (blob.size > PROFILE_IMAGE_MAX_PROCESSED_BYTES) {
    throw new Error('Processed image is still too large. Please choose a smaller image.');
  }

  return readFileAsDataUrl(
    new File([blob], 'profile.jpg', { type: PROFILE_IMAGE_OUTPUT_TYPE })
  );
}
