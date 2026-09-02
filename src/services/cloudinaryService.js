import cloudinary from '../config/cloudinary.js';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_KB,
  UPLOAD_FOLDERS,
} from '../constants/upload.js';

export function resolveUploadFolder(folderKey) {
  if (!folderKey) return null;
  const normalizedKey = String(folderKey).trim().toUpperCase();
  if (UPLOAD_FOLDERS[normalizedKey]) {
    return UPLOAD_FOLDERS[normalizedKey];
  }

  // Check if value directly matches an allowed folder
  const matchingKey = Object.keys(UPLOAD_FOLDERS).find(
    (key) => UPLOAD_FOLDERS[key].toLowerCase() === String(folderKey).trim().toLowerCase(),
  );

  return matchingKey ? UPLOAD_FOLDERS[matchingKey] : null;
}

export function generateUploadSignature({ fileSize, folderKey }) {
  const targetFolder = resolveUploadFolder(folderKey);

  if (!targetFolder) {
    const error = new Error('Invalid or unsupported upload destination folder.');
    error.code = 'INVALID_FOLDER';
    error.statusCode = 400;
    throw error;
  }

  if (fileSize !== undefined && fileSize !== null) {
    const sizeNum = Number(fileSize);
    if (Number.isNaN(sizeNum) || sizeNum <= 0) {
      const error = new Error('File size must be a positive number.');
      error.code = 'INVALID_FILE_SIZE';
      error.statusCode = 400;
      throw error;
    }

    if (sizeNum > MAX_IMAGE_SIZE_BYTES) {
      const error = new Error(`Image size exceeds the maximum limit of ${MAX_IMAGE_SIZE_KB} KB.`);
      error.code = 'FILE_TOO_LARGE';
      error.statusCode = 400;
      throw error;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'soulsync_images';

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error('Cloudinary credentials are not properly configured on the server.');
    error.code = 'CONFIG_ERROR';
    error.statusCode = 500;
    throw error;
  }

  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = {
    folder: targetFolder,
    timestamp,
    upload_preset: uploadPreset,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    apiKey,
    cloudName,
    folder: targetFolder,
    maxImageSizeKb: MAX_IMAGE_SIZE_KB,
    signature,
    timestamp,
    uploadPreset,
  };
}
