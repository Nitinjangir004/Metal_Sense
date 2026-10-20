import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR
  ? path.resolve(process.env.LOCAL_UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/csv',
  'text/x-csv',
  'application/x-csv',
  'text/comma-separated-values',
  'text/x-comma-separated-values',
  'application/octet-stream',
]);

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Generate unguessable safe storage key preventing directory traversal
    const safeExt = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, safeExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueKey = `${crypto.randomUUID()}_${sanitizedBase}${safeExt}`;
    cb(null, uniqueKey);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const mime = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();
  const isCsvExt = ext === '.csv';
  const isDocExt = ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp';

  if (ALLOWED_MIME_TYPES.has(mime) || isCsvExt || isDocExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type '${file.mimetype}'. Allowed types: CSV, PDF, PNG, JPEG, WebP.`
      )
    );
  }
};

/**
 * Validates the magic bytes of an uploaded file against its reported MIME type.
 * Protects against MIME spoofing and malicious binary uploads.
 */
export function verifyFileMagicBytes(filePath: string, reportedMime: string): boolean {
  if (!fs.existsSync(filePath)) return false;

  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);

  if (bytesRead < 4) return false;

  const mime = reportedMime.toLowerCase();
  const ext = path.extname(filePath).toLowerCase();

  // PDF signature: %PDF (0x25 0x50 0x44 0x46)
  if (mime === 'application/pdf' || ext === '.pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // PNG signature: 0x89 0x50 0x4E 0x47
  if (mime === 'image/png' || ext === '.png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // JPEG signature: 0xFF 0xD8 0xFF
  if (mime === 'image/jpeg' || mime === 'image/jpg' || ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // WebP signature: RIFF....WEBP
  if (mime === 'image/webp' || ext === '.webp') {
    return (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  // CSV / text / spreadsheet: Reject any file containing null bytes (0x00)
  const isCsvOrText =
    mime.includes('csv') ||
    mime.includes('excel') ||
    mime.includes('text') ||
    mime === 'application/octet-stream' ||
    ext === '.csv' ||
    ext === '.txt';

  if (isCsvOrText) {
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0x00) return false;
    }
    return true;
  }

  return false;
}

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB strict limit
    files: 1,
  },
  fileFilter,
});
