import { s3Service } from '../services/s3.service';

export function isRemoteUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:');
}

export async function resolveImageUrl(
  value: string | null | undefined
): Promise<string | null> {
  if (!value) return null;
  if (isRemoteUrl(value)) return value;
  return s3Service.getPresignedDownloadUrl(value);
}

export async function resolveImageUrls<T extends Record<string, unknown>>(
  items: T[],
  fields: (keyof T)[]
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const resolved = { ...item };
      for (const field of fields) {
        const value = item[field];
        if (typeof value === 'string') {
          (resolved as Record<string, unknown>)[field as string] = await resolveImageUrl(value);
        }
      }
      return resolved;
    })
  );
}
