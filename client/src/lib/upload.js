import { apiFetch } from './api.js';

export async function uploadFile(file, folder = 'avatar') {
  if (!(file instanceof File)) {
    throw new Error('File upload không hợp lệ.');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  return apiFetch('/api/v1/uploads', {
    method: 'POST',
    body: formData,
  });
}

export function deleteUploadedFile(publicId) {
  const params = new URLSearchParams({ publicId });
  return apiFetch(`/api/v1/uploads?${params.toString()}`, {
    method: 'DELETE',
  });
}