import path from 'node:path';
import { env } from '../env.js';
import { supabase } from '../lib/supabase.js';

const sanitizeName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const extensionFromMime = (mimeType: string): string => {
  if (mimeType === 'image/png') {
    return '.png';
  }

  if (mimeType === 'image/heic') {
    return '.heic';
  }

  return '.jpg';
};

export const uploadReportPhotos = async (params: {
  files: Express.Multer.File[];
  reportId: string;
  userId: string;
}): Promise<string[]> => {
  const uploads = params.files.map(async (file, index) => {
    const ext = path.extname(file.originalname) || extensionFromMime(file.mimetype);
    const safeBase = sanitizeName(path.basename(file.originalname, path.extname(file.originalname)) || 'photo');
    const objectPath = `${params.userId}/${params.reportId}/${Date.now()}-${index}-${safeBase}${ext}`;

    const { error } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(objectPath, file.buffer, {
      upsert: false,
      contentType: file.mimetype,
      cacheControl: '3600',
    });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);

    return publicUrl;
  });

  return Promise.all(uploads);
};
