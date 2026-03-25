/**
 * File validation utilities for secure file uploads
 *
 * Validates files using magic bytes (file signatures) to ensure
 * the file content matches the expected type, preventing attacks
 * where malicious files are renamed to bypass MIME type checks.
 */

/**
 * Magic byte signatures for common image formats
 * Each entry maps a MIME type to its expected file signature(s)
 */
const IMAGE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> =
  {
    'image/jpeg': [
      { bytes: [0xff, 0xd8, 0xff] }, // JPEG SOI marker
    ],
    'image/png': [
      { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG signature
    ],
    'image/gif': [
      { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
      { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
    ],
    'image/webp': [
      { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header (WebP container)
    ],
  };

/**
 * Validates that a file's content matches its claimed MIME type
 * by checking magic bytes (file signature)
 *
 * @param buffer - File content buffer
 * @param mimeType - Claimed MIME type
 * @returns Object with validation result and detected type
 */
export function validateImageSignature(
  buffer: Buffer,
  mimeType: string,
): { isValid: boolean; detectedType?: string; error?: string } {
  if (!buffer || buffer.length < 8) {
    return { isValid: false, error: 'File is too small to be a valid image' };
  }

  // Check against known signatures
  for (const [type, signatures] of Object.entries(IMAGE_SIGNATURES)) {
    for (const sig of signatures) {
      const offset = sig.offset || 0;
      const matches = sig.bytes.every(
        (byte, index) => buffer[offset + index] === byte,
      );

      if (matches) {
        // For WebP, also check for WEBP marker at offset 8
        if (type === 'image/webp') {
          const webpMarker = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
          const isWebp = webpMarker.every(
            (byte, index) => buffer[8 + index] === byte,
          );
          if (!isWebp) continue;
        }

        // Check if detected type matches claimed type
        if (type === mimeType) {
          return { isValid: true, detectedType: type };
        }

        // Type mismatch - file signature doesn't match MIME type
        return {
          isValid: false,
          detectedType: type,
          error: `File signature indicates ${type}, but claimed MIME type is ${mimeType}`,
        };
      }
    }
  }

  // No matching signature found
  return {
    isValid: false,
    error: 'Could not verify file as a valid image format',
  };
}

/**
 * Sanitizes a filename to prevent path traversal and other attacks
 *
 * - Removes directory traversal sequences (../, ..\)
 * - Removes null bytes
 * - Limits to alphanumeric, dashes, underscores, and dots
 * - Preserves file extension
 * - Limits total length
 *
 * @param filename - Original filename
 * @param maxLength - Maximum allowed length (default 100)
 * @returns Sanitized filename
 */
export function sanitizeFilename(
  filename: string,
  maxLength: number = 100,
): string {
  if (!filename) {
    return `file_${Date.now()}`;
  }

  // Extract extension
  const lastDot = filename.lastIndexOf('.');
  const ext = lastDot > 0 ? filename.slice(lastDot).toLowerCase() : '';
  const baseName = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Sanitize base name
  let sanitized = baseName
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove path separators and traversal
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    // Keep only safe characters
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    // Collapse multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  // Ensure we have something
  if (!sanitized) {
    sanitized = `file_${Date.now()}`;
  }

  // Truncate if needed (accounting for extension)
  const maxBaseLength = maxLength - ext.length;
  if (sanitized.length > maxBaseLength) {
    sanitized = sanitized.slice(0, maxBaseLength);
  }

  // Only allow safe extensions for images
  const safeExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const finalExt = safeExtensions.includes(ext) ? ext : '.bin';

  return sanitized + finalExt;
}

/**
 * Generates a unique filename with timestamp
 * Useful for preventing filename conflicts and ensuring uniqueness
 *
 * @param originalName - Original filename
 * @returns Unique sanitized filename
 */
export function generateUniqueFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const lastDot = sanitized.lastIndexOf('.');
  const ext = lastDot > 0 ? sanitized.slice(lastDot) : '';
  const baseName = lastDot > 0 ? sanitized.slice(0, lastDot) : sanitized;

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);

  return `${baseName}_${timestamp}_${random}${ext}`;
}
