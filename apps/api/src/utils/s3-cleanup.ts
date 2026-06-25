import { s3Service } from '../services/s3.service';
import { isRemoteUrl } from './image-url';

export function isStoredS3Key(value: string | null | undefined): value is string {
  return Boolean(value && !isRemoteUrl(value));
}

/** Delete an S3 object when the DB stores an S3 key (not an external URL). */
export async function deleteStoredImage(value: string | null | undefined): Promise<void> {
  if (!isStoredS3Key(value)) return;
  await s3Service.deleteObject(value).catch(() => undefined);
}

/** Delete the previous S3 object when an image field is replaced or cleared. */
export async function cleanupReplacedImage(
  previous: string | null | undefined,
  next: string | null | undefined
): Promise<void> {
  if (!isStoredS3Key(previous)) return;
  if (previous === next) return;
  await deleteStoredImage(previous);
}
