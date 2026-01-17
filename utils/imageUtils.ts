/**
 * Image utilities for the Fishing Log app
 * Simplified version that works with ImagePicker's built-in compression
 */

/**
 * Compresses an image
 * Since ImagePicker already handles compression via the quality setting,
 * this function is a passthrough. The compression happens at pick time.
 * @param uri - The URI of the image to compress
 * @returns The same URI (compression already done by ImagePicker)
 */
export async function compressImage(uri: string): Promise<string> {
  // ImagePicker already compresses images via quality setting
  return uri;
}

/**
 * Saves an image to the app's document directory
 * For now, we just return the URI as ImagePicker already saves to a temp location
 * @param sourceUri - The source URI of the image
 * @param _filename - Optional filename (unused in this simplified version)
 * @returns The image URI
 */
export async function saveImageToDocuments(
  sourceUri: string,
  _filename?: string
): Promise<string> {
  // In a production app, you would copy the file to permanent storage
  // For now, ImagePicker's temp location works fine
  return sourceUri;
}

/**
 * Processes and saves an image
 * @param uri - The URI of the image to process
 * @returns The final saved image URI
 */
export async function processAndSaveImage(uri: string): Promise<string> {
  try {
    const compressedUri = await compressImage(uri);
    const savedUri = await saveImageToDocuments(compressedUri);
    return savedUri;
  } catch (error) {
    console.error("Failed to process image:", error);
    return uri;
  }
}

/**
 * Gets the file size of an image in bytes
 * Note: This is a simplified version that returns 0
 * In production, you would use expo-file-system
 * @param _uri - The URI of the image
 * @returns File size in bytes (0 in this simplified version)
 */
export async function getImageSize(_uri: string): Promise<number> {
  // Simplified - in production use expo-file-system's getInfoAsync
  return 0;
}

/**
 * Formats file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Deletes an image from the file system
 * Note: This is a no-op in this simplified version
 * @param _uri - The URI of the image to delete
 */
export async function deleteImage(_uri: string): Promise<void> {
  // Simplified - in production use expo-file-system's deleteAsync
  // The temp files from ImagePicker are automatically cleaned up
}
