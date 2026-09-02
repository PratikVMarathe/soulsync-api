export const UPLOAD_FOLDERS = {
  QUIZ: 'soulsync/quiz-images',
  MANDALA: 'soulsync/mandala-images',
};

export const ALLOWED_FOLDER_KEYS = Object.keys(UPLOAD_FOLDERS);

export const DEFAULT_MAX_IMAGE_SIZE_KB = 500;

export const MAX_IMAGE_SIZE_KB = Number(process.env.MAX_IMAGE_SIZE_KB) || DEFAULT_MAX_IMAGE_SIZE_KB;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_KB * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];
