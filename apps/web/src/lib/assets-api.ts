import { apiRequest } from './api-client';
import { normalizeContentType, uploadFileToPresignedUrl, type CatalogCategory } from './s3-upload';

export type { CatalogCategory };

export const assetsApi = {
  uploadCatalogImage: async (category: CatalogCategory, file: File): Promise<string> => {
    const contentType = normalizeContentType(file);

    const initResponse = await apiRequest<{ s3Key: string; uploadUrl: string }>(
      'POST',
      '/api/v1/assets/upload-url',
      {
        category,
        filename: file.name,
        contentType,
      }
    );

    const payload = initResponse.data;
    if (!payload?.uploadUrl || !payload?.s3Key) {
      throw new Error('Failed to get upload URL');
    }

    await uploadFileToPresignedUrl(payload.uploadUrl, file, contentType);

    return payload.s3Key;
  },
};

/** Upload new file, clear existing, or omit field to keep current image on edit. */
export async function resolveImageField(
  category: CatalogCategory,
  file: File | null,
  removeExisting: boolean,
  hasExisting: boolean
): Promise<string | null | undefined> {
  if (file) return assetsApi.uploadCatalogImage(category, file);
  if (removeExisting && hasExisting) return null;
  return undefined;
}
