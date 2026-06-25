import { apiRequest } from './api-client';
import { getImageDimensions, normalizeContentType, uploadFileToPresignedUrl } from './s3-upload';

export type PhotographerStats = {
  totalLifetimeUploads: number;
  todayUploads: number;
};

export type PhotographerPhoto = {
  id: string;
  filename: string;
  s3Key: string;
  imageUrl: string | null;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  expiresAt: string;
};

export type PhotographerHistoryDay = {
  id: string;
  date: string;
  photoCount: number;
  sessionDuration: string;
  firstUploadAt: string;
  lastUploadAt: string;
  thumbnails: Array<{ id: string; imageUrl: string | null; filename: string }>;
  photos: Array<{
    id: string;
    filename: string;
    imageUrl: string | null;
    createdAt: string;
    fileSize: number;
  }>;
};

export const photographerApi = {
  login: (username: string, password: string) =>
    apiRequest('POST', '/api/v1/auth/login-username', { username, password }),

  logout: () => apiRequest('POST', '/api/v1/auth/logout'),

  getStats: () => apiRequest<PhotographerStats>('GET', '/api/v1/photographer/stats'),

  getPhotos: (page = 1, limit = 20) =>
    apiRequest<{ items: PhotographerPhoto[]; total: number; page: number; limit: number }>(
      'GET',
      `/api/v1/photographer/photos?page=${page}&limit=${limit}`
    ),

  getHistory: (filter: 'all' | 'today' | 'week' | 'month' = 'all') =>
    apiRequest<{ items: PhotographerHistoryDay[]; totalPhotos: number; totalDays: number }>(
      'GET',
      `/api/v1/photographer/history?filter=${filter}`
    ),

  uploadPhoto: async (file: File) => {
    const contentType = normalizeContentType(file);
    const { width, height } = await getImageDimensions(file);

    const initResponse = await apiRequest<{
      photo: { id: string; s3Key: string; filename: string };
      uploadUrl: string;
    }>('POST', '/api/v1/photographer/upload-url', {
      filename: file.name,
      contentType,
      width,
      height,
    });

    if (!initResponse.data) {
      throw new Error('Upload initialization failed');
    }

    await uploadFileToPresignedUrl(initResponse.data.uploadUrl, file, contentType);

    await apiRequest('POST', `/api/v1/photographer/photos/${initResponse.data.photo.id}/confirm-upload`);

    return initResponse.data.photo;
  },

  deletePhoto: (photoId: string) =>
    apiRequest('DELETE', `/api/v1/photographer/photos/${photoId}`),
};

export { assetsApi } from './assets-api';
