/**
 * High-Scale Client-Side Media Optimizer for PocketSwap
 * -----------------------------------------------------
 * Compresses 5MB–15MB mobile camera photos into fast ~80KB WebP images
 * using offscreen Canvas before uploading to Supabase Storage / CDN,
 * and validates + extracts poster thumbnails from video files.
 */

export interface OptimizedMediaResult {
  blob?: Blob;
  dataUrl: string;
  thumbnailDataUrl?: string;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  mediaType: 'image' | 'video';
  durationSec?: number;
}

const MAX_IMAGE_DIMENSION = 1080; // Crisp on retina phones while keeping payload tiny
const WEBP_QUALITY = 0.82;
const MAX_VIDEO_SIZE_MB = 35;
const MAX_VIDEO_DURATION_SEC = 45;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function optimizeImageFile(file: File): Promise<OptimizedMediaResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not initialize 2D canvas context for compression'));
        return;
      }

      // Smooth high-quality downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Generate tiny 24px blur placeholder for instant card rendering
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 24;
      thumbCanvas.height = Math.max(18, Math.round((24 * height) / width));
      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx?.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbnailDataUrl = thumbCanvas.toDataURL('image/webp', 0.5);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            const compressedBytes = blob.size;
            const savingsPercent = Math.max(
              0,
              Math.round(((file.size - compressedBytes) / file.size) * 100)
            );

            resolve({
              blob,
              dataUrl,
              thumbnailDataUrl,
              originalBytes: file.size,
              compressedBytes,
              savingsPercent,
              width,
              height,
              mediaType: 'image',
            });
          };
          reader.readAsDataURL(blob);
        },
        'image/webp',
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file'));
    };

    img.src = objectUrl;
  });
}

export async function validateAndExtractVideoPoster(
  file: File
): Promise<OptimizedMediaResult> {
  const maxBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `Video is too large (${formatBytes(file.size)}). Max allowed is ${MAX_VIDEO_SIZE_MB}MB for fast mobile streaming.`
    );
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      if (video.duration > MAX_VIDEO_DURATION_SEC) {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            `Video is ${Math.round(video.duration)}s long. Please keep item showcase clips under ${MAX_VIDEO_DURATION_SEC}s.`
          )
        );
        return;
      }
      // Seek to 0.5s to capture a clean poster thumbnail
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const width = video.videoWidth || 720;
      const height = video.videoHeight || 540;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(640, width);
      canvas.height = Math.round((canvas.width * height) / width);
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailDataUrl = canvas.toDataURL('image/webp', 0.75);

      resolve({
        blob: file,
        dataUrl: objectUrl,
        thumbnailDataUrl,
        originalBytes: file.size,
        compressedBytes: file.size,
        savingsPercent: 0,
        width,
        height,
        mediaType: 'video',
        durationSec: Math.round(video.duration),
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read video file metadata'));
    };

    video.src = objectUrl;
  });
}
