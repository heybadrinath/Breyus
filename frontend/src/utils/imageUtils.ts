/**
 * Utility functions for image handling and optimization
 */

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Get optimized image URL with fallback handling
 */
export const getOptimizedImageUrl = (
  originalUrl?: string,
  options: ImageOptions = {}
): string => {
  if (!originalUrl) {
    return '/placeholder-product.svg';
  }

  // If it's already a placeholder or local asset, return as is
  if (originalUrl.startsWith('/') || originalUrl.includes('placeholder')) {
    return originalUrl;
  }

  // For external URLs, you could add image optimization service here
  // For example, if using a CDN like Cloudinary or ImageKit
  // return `https://your-cdn.com/image/fetch/w_${options.width || 400},h_${options.height || 400},q_${options.quality || 80},f_${options.format || 'webp'}/${encodeURIComponent(originalUrl)}`;

  return originalUrl;
};

/**
 * Get multiple image sources for different screen sizes
 */
export const getResponsiveImageSources = (
  originalUrl?: string
): { src: string; srcSet?: string } => {
  const baseUrl = getOptimizedImageUrl(originalUrl);
  
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return { src: baseUrl };
  }

  // Generate srcSet for different screen densities
  const srcSet = [
    `${getOptimizedImageUrl(originalUrl, { width: 200 })} 1x`,
    `${getOptimizedImageUrl(originalUrl, { width: 400 })} 2x`,
    `${getOptimizedImageUrl(originalUrl, { width: 600 })} 3x`,
  ].join(', ');

  return {
    src: baseUrl,
    srcSet,
  };
};

/**
 * Preload critical images
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Check if image URL is valid
 */
export const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  
  // Check for data URLs
  const isDataUrl = url.startsWith('data:image/');
  
  // Check for blob URLs
  const isBlobUrl = url.startsWith('blob:');
  
  // Check for local paths
  const isLocalPath = url.startsWith('/');
  
  return imageExtensions.test(url) || isDataUrl || isBlobUrl || isLocalPath;
};

/**
 * Generate placeholder image URL based on dimensions and text
 */
export const generatePlaceholder = (
  width: number = 400,
  height: number = 400,
  text: string = 'Product',
  backgroundColor: string = 'f3f4f6',
  textColor: string = '6b7280'
): string => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#${backgroundColor}"/>
      <rect x="${width * 0.2}" y="${height * 0.2}" width="${width * 0.6}" height="${height * 0.4}" rx="8" fill="#d1d5db"/>
      <circle cx="${width * 0.35}" cy="${height * 0.35}" r="${width * 0.05}" fill="#9ca3af"/>
      <path d="M${width * 0.25} ${height * 0.55}L${width * 0.35} ${height * 0.45}L${width * 0.45} ${height * 0.55}L${width * 0.55} ${height * 0.45}L${width * 0.75} ${height * 0.65}V${height * 0.7}H${width * 0.25}V${height * 0.55}Z" fill="#9ca3af"/>
      <text x="${width / 2}" y="${height * 0.85}" text-anchor="middle" fill="#${textColor}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}">${text}</text>
    </svg>
  `)}`;
};

/**
 * Image size presets for consistent sizing across the app
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 48, height: 48 },
  small: { width: 80, height: 80 },
  medium: { width: 120, height: 120 },
  large: { width: 200, height: 200 },
  card: { width: 240, height: 192 },
  hero: { width: 800, height: 400 },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES; 