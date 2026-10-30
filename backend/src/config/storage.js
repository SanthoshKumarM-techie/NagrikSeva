import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function uploadFileToStorage(file, folder = 'evidence') {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseBucket = process.env.SUPABASE_BUCKET || 'complaint-evidence';

  // If Supabase is configured, upload via REST API
  if (supabaseUrl && supabaseKey) {
    try {
      const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${supabaseBucket}/${fileName}`;

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': file.mimetype,
        },
        body: file.buffer,
      });

      if (res.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${fileName}`;
        return {
          url: publicUrl,
          path: fileName,
          fileName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      }
      console.warn('Supabase storage upload failed, falling back to local file storage:', await res.text());
    } catch (err) {
      console.warn('Supabase upload exception, using local fallback:', err.message);
    }
  }

  // Local Storage Fallback
  const targetFolder = path.join(uploadDir, folder);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(targetFolder, safeName);

  if (file.buffer) {
    fs.writeFileSync(filePath, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, filePath);
  }

  const publicUrl = `/uploads/${folder}/${safeName}`;
  return {
    url: publicUrl,
    path: filePath,
    fileName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
}

export const uploadFile = uploadFileToStorage;

export default {
  uploadFile,
  uploadFileToStorage,
  uploadDir
};
