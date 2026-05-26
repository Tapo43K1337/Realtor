import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';

export type StoredPhoto = { filename: string; thumbFilename: string };

export async function processAndStorePhoto(
  propertyId: number,
  buffer: Buffer
): Promise<StoredPhoto> {
  const dir = join(config.uploadsDir, 'properties', String(propertyId));
  await mkdir(dir, { recursive: true });

  const stamp = Date.now();
  const rnd = randomBytes(4).toString('hex');
  const base = `${stamp}_${rnd}`;

  const fullName = `${base}.jpg`;
  const thumbName = `${base}_thumb.jpg`;

  // Sharp pipeline: max 1920px long side, JPEG quality 82
  await sharp(buffer)
    .rotate() // honor EXIF orientation
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(dir, fullName));

  await sharp(buffer)
    .rotate()
    .resize({ width: 400, height: 400, fit: 'cover' })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(join(dir, thumbName));

  return { filename: fullName, thumbFilename: thumbName };
}

export async function deletePhotoFiles(propertyId: number, filename: string, thumb: string | null) {
  const dir = join(config.uploadsDir, 'properties', String(propertyId));
  await unlink(join(dir, filename)).catch(() => {});
  if (thumb) await unlink(join(dir, thumb)).catch(() => {});
}

export function photoUrl(propertyId: number, filename: string): string {
  return `/uploads/properties/${propertyId}/${filename}`;
}

/** Store an agent avatar — square 512px, JPEG. Returns a public URL path. */
export async function processAndStoreAgentPhoto(agentId: number, buffer: Buffer): Promise<string> {
  const dir = join(config.uploadsDir, 'agents', String(agentId));
  await mkdir(dir, { recursive: true });

  const stamp = Date.now();
  const rnd = randomBytes(4).toString('hex');
  const filename = `${stamp}_${rnd}.jpg`;

  await sharp(buffer)
    .rotate()
    .resize({ width: 512, height: 512, fit: 'cover' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(join(dir, filename));

  return `/uploads/agents/${agentId}/${filename}`;
}
