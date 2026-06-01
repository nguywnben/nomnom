import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const configured = Boolean(cloudName && apiKey && apiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const uploadFolders = new Set(['avatar', 'restaurant', 'menu', 'driver-kyc', 'review']);

export function normalizeUploadFolder(folder) {
  const value = String(folder ?? 'avatar').trim();
  return uploadFolders.has(value) ? value : 'avatar';
}

function requireCloudinaryConfig() {
  if (!configured) {
    const error = new Error('Cloudinary chưa được cấu hình.');
    error.status = 500;
    throw error;
  }
}

function createPublicId(folder) {
  const safeFolder = normalizeUploadFolder(folder).replace(/[^a-z0-9-]/gi, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${safeFolder}_${Date.now()}_${suffix}`;
}

export async function uploadImageBuffer({ buffer, folder }) {
  requireCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'nomnom',
        resource_type: 'image',
        public_id: createPublicId(folder),
        overwrite: false,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function deleteUploadedImage(publicId) {
  requireCloudinaryConfig();
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}