export type KioskBrowsePhoto = {
  id: string;
  s3Key: string;
  imageUrl: string | null;
  filename: string;
  capturedAt: string;
  similarity?: number;
};

export type KioskSelectedAlbum = {
  photos: KioskBrowsePhoto[];
  frameId: string | null;
  frameUrl: string | null;
  source: 'face-search' | 'manual';
};

const FACE_MATCHES_KEY = 'facecraft_kiosk_face_matches';
const SELECTED_ALBUM_KEY = 'facecraft_kiosk_selected_album';

export function saveFaceMatchPhotos(photos: KioskBrowsePhoto[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(FACE_MATCHES_KEY, JSON.stringify(photos));
}

export function loadFaceMatchPhotos(): KioskBrowsePhoto[] {
  if (typeof window === 'undefined') return [];
  const raw = sessionStorage.getItem(FACE_MATCHES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as KioskBrowsePhoto[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearFaceMatchPhotos(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FACE_MATCHES_KEY);
}

export function saveSelectedAlbum(album: KioskSelectedAlbum): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SELECTED_ALBUM_KEY, JSON.stringify(album));
}

export function loadSelectedAlbum(): KioskSelectedAlbum | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SELECTED_ALBUM_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KioskSelectedAlbum;
  } catch {
    return null;
  }
}

export function clearSelectedAlbum(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SELECTED_ALBUM_KEY);
}

export function clearKioskPhotoSession(): void {
  clearFaceMatchPhotos();
  clearSelectedAlbum();
}
