export type CatalogCategory =
  | 'products'
  | 'frames'
  | 'objects'
  | 'ultra-objects'
  | 'combos'
  | 'profiles';

function normalizeContentType(file: File): string {
  if (file.type && file.type.startsWith('image/')) {
    return file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'avif') return 'image/avif';
  return 'image/jpeg';
}

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read image dimensions for ${file.name}`));
    };
    img.src = url;
  });
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed (HTTP ${response.status})`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Browser could not reach S3. Add CORS rules on your S3 bucket allowing PUT from http://localhost:3000 — see S3_SETUP.md'
      );
    }
    throw error;
  }
}

export { normalizeContentType };
