import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Saca `media.prefix`, la columna que agregaba el adaptador de S3 para guardar
 * bajo que prefijo del bucket quedaba cada archivo.
 *
 * Ya no hay bucket: los archivos viven en el disco de la VM y los sirve Payload
 * por /api/media/file/. La columna quedaba con 'media' en todas las filas y sin
 * nadie que la leyera.
 *
 * El `down` la devuelve con su default, asi que revertir no pierde nada: el
 * valor era el mismo para todas las filas.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "prefix";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT 'media';`)
}
