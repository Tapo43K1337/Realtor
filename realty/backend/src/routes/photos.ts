import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireRealtor } from '../auth.js';
import { processAndStorePhoto, deletePhotoFiles } from '../services/photos.js';
import { config } from '../config.js';

export async function photoRoutes(app: FastifyInstance) {
  // Upload one or more photos for a property
  app.post('/:id/photos', { preHandler: requireRealtor }, async (req: any, reply) => {
    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId)) return reply.code(400).send({ error: 'bad_id' });

    // Count existing
    const existing = await query<{ c: string }>(
      'SELECT COUNT(*)::text as c FROM property_photos WHERE property_id = $1',
      [propertyId]
    );
    let current = Number(existing.rows[0].c);

    const inserted: any[] = [];
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type !== 'file') continue;
      if (current >= config.maxPhotosPerObject) {
        return reply.code(400).send({ error: 'photo_limit_exceeded', limit: config.maxPhotosPerObject });
      }
      const buf = await part.toBuffer();
      const stored = await processAndStorePhoto(propertyId, buf);
      const isCover = current === 0;
      const r = await query<{ id: number }>(
        `INSERT INTO property_photos (property_id, filename, thumb_filename, is_cover, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [propertyId, stored.filename, stored.thumbFilename, isCover, current]
      );
      inserted.push({
        id: r.rows[0].id,
        url: `/uploads/properties/${propertyId}/${stored.filename}`,
        thumb_url: `/uploads/properties/${propertyId}/${stored.thumbFilename}`,
        is_cover: isCover,
        sort_order: current,
      });
      current++;
    }
    return { photos: inserted };
  });

  // Reorder photos
  app.put('/:id/photos/order', { preHandler: requireRealtor }, async (req: any, reply) => {
    const propertyId = Number(req.params.id);
    const body = z.object({ ids: z.array(z.number().int()) }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid_body' });
    for (let i = 0; i < body.data.ids.length; i++) {
      await query(
        'UPDATE property_photos SET sort_order = $2, is_cover = ($2 = 0) WHERE id = $1 AND property_id = $3',
        [body.data.ids[i], i, propertyId]
      );
    }
    return { ok: true };
  });

  // Set cover
  app.put('/:id/photos/:photoId/cover', { preHandler: requireRealtor }, async (req: any) => {
    const propertyId = Number(req.params.id);
    const photoId = Number(req.params.photoId);
    await query('UPDATE property_photos SET is_cover = FALSE WHERE property_id = $1', [propertyId]);
    await query('UPDATE property_photos SET is_cover = TRUE WHERE id = $1', [photoId]);
    return { ok: true };
  });

  // Delete photo
  app.delete('/:id/photos/:photoId', { preHandler: requireRealtor }, async (req: any) => {
    const propertyId = Number(req.params.id);
    const photoId = Number(req.params.photoId);
    const r = await query<{ filename: string; thumb_filename: string | null }>(
      'DELETE FROM property_photos WHERE id = $1 AND property_id = $2 RETURNING filename, thumb_filename',
      [photoId, propertyId]
    );
    if (r.rowCount && r.rows[0].filename) {
      await deletePhotoFiles(propertyId, r.rows[0].filename, r.rows[0].thumb_filename);
    }
    return { ok: true };
  });
}
