export const config = {
  port: Number(process.env.API_PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtTtl: Number(process.env.JWT_TTL ?? 3600),
  botToken: process.env.BOT_TOKEN ?? '',
  realtorTgIds: (process.env.REALTOR_TG_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => BigInt(s)),
  uploadsDir: process.env.UPLOADS_DIR ?? '/app/uploads',
  maxPhotosPerObject: Number(process.env.MAX_PHOTOS_PER_OBJECT ?? 50),
  photoMaxSizeMb: Number(process.env.PHOTO_MAX_SIZE_MB ?? 10),
  appUrl: process.env.APP_URL ?? 'http://localhost',
};

export function isRealtor(tgId: bigint | number | string): boolean {
  const id = BigInt(tgId);
  return config.realtorTgIds.includes(id);
}
