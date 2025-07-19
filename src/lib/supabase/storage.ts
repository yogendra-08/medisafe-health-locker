import { supabase } from './config';

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  filePath?: string;
  error?: string;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID for organizing files
 * @param folder - The folder name (default: 'documents')
 * @returns Promise<FileUploadResult>
 */
export async function uploadFile(
  file: File,
  userId: string,
  folder: string = 'documents'
): Promise<FileUploadResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase is not configured'
    };
  }

  try {
    // Generate a unique filename to prevent conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${folder}/${userId}/${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from('medical-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('medical-files')
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      filePath: filePath
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - The path of the file to delete
 * @returns Promise<FileDeleteResult>
 */
export async function deleteFile(filePath: string): Promise<FileDeleteResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase is not configured'
    };
  }

  try {
    const { error } = await supabase.storage
      .from('medical-files')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Delete failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Get a public URL for a file
 * @param filePath - The path of the file
 * @returns string | null
 */
export function getFileUrl(filePath: string): string | null {
  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage
    .from('medical-files')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Download a file from Supabase Storage
 * @param filePath - The path of the file to download
 * @returns Promise<Blob | null>
 */
export async function downloadFile(filePath: string): Promise<Blob | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from('medical-files')
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Download failed:', error);
    return null;
  }
} 