import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('es');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_published_locale" AS ENUM('es');
  CREATE TYPE "public"."enum_promociones_verticales" AS ENUM('casino', 'casino-en-vivo', 'deportes', 'esports', 'virtuales');
  CREATE TYPE "public"."enum_promociones_tipo" AS ENUM('bienvenida', 'recarga', 'sin-deposito', 'giros-gratis', 'cashback', 'torneo', 'otro');
  CREATE TYPE "public"."enum_promociones_combinable" AS ENUM('si', 'no');
  CREATE TYPE "public"."enum_promociones_activacion" AS ENUM('automatica', 'a-pedido');
  CREATE TYPE "public"."enum_promociones_estado" AS ENUM('activa', 'expirada');
  CREATE TYPE "public"."enum_promociones_origen" AS ENUM('scraper', 'manual');
  CREATE TYPE "public"."enum_promociones_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__promociones_v_version_verticales" AS ENUM('casino', 'casino-en-vivo', 'deportes', 'esports', 'virtuales');
  CREATE TYPE "public"."enum__promociones_v_version_tipo" AS ENUM('bienvenida', 'recarga', 'sin-deposito', 'giros-gratis', 'cashback', 'torneo', 'otro');
  CREATE TYPE "public"."enum__promociones_v_version_combinable" AS ENUM('si', 'no');
  CREATE TYPE "public"."enum__promociones_v_version_activacion" AS ENUM('automatica', 'a-pedido');
  CREATE TYPE "public"."enum__promociones_v_version_estado" AS ENUM('activa', 'expirada');
  CREATE TYPE "public"."enum__promociones_v_version_origen" AS ENUM('scraper', 'manual');
  CREATE TYPE "public"."enum__promociones_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__promociones_v_published_locale" AS ENUM('es');
  CREATE TYPE "public"."enum_plataformas_adaptador" AS ENUM('jugadon', 'jugadon-bonus-engine', 'jugadon-sircms');
  CREATE TYPE "public"."enum_puntos_de_venta_tipo" AS ENUM('sala', 'agencia', 'punto-de-pago');
  CREATE TYPE "public"."enum_puntos_de_venta_provincia" AS ENUM('buenos-aires', 'caba', 'catamarca', 'chaco', 'chubut', 'cordoba', 'corrientes', 'entre-rios', 'formosa', 'jujuy', 'la-pampa', 'la-rioja', 'mendoza', 'misiones', 'neuquen', 'rio-negro', 'salta', 'san-juan', 'san-luis', 'santa-cruz', 'santa-fe', 'santiago-del-estero', 'tierra-del-fuego', 'tucuman');
  CREATE TYPE "public"."enum_users_rol" AS ENUM('admin', 'editor', 'autor');
  CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'scrapearPromociones');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'scrapearPromociones');
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"portada_id" integer,
  	"categoria_id" integer,
  	"autor_id" integer,
  	"publicado_en" timestamp(3) with time zone,
  	"actualizado_en" timestamp(3) with time zone,
  	"destacado" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "posts_locales" (
  	"titulo" varchar,
  	"slug" varchar,
  	"resumen" varchar,
  	"contenido" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_portada_id" integer,
  	"version_categoria_id" integer,
  	"version_autor_id" integer,
  	"version_publicado_en" timestamp(3) with time zone,
  	"version_actualizado_en" timestamp(3) with time zone,
  	"version_destacado" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__posts_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_posts_v_locales" (
  	"version_titulo" varchar,
  	"version_slug" varchar,
  	"version_resumen" varchar,
  	"version_contenido" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"nombre" varchar NOT NULL,
  	"slug" varchar,
  	"descripcion" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags_locales" (
  	"nombre" varchar NOT NULL,
  	"slug" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "authors_credenciales" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "authors_credenciales_locales" (
  	"texto" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "authors_enlaces" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"foto_id" integer,
  	"usuario_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "authors_locales" (
  	"slug" varchar,
  	"cargo" varchar,
  	"bio" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "promociones_verticales" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_promociones_verticales",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "promociones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"plataforma_id" integer,
  	"tipo" "enum_promociones_tipo",
  	"portada_id" integer,
  	"imagen_origen" varchar,
  	"cuota_minima" numeric,
  	"dias_para_cumplir" numeric,
  	"usos_por_usuario" numeric,
  	"combinable" "enum_promociones_combinable",
  	"activacion" "enum_promociones_activacion",
  	"codigo" varchar,
  	"juegos_habilitados" numeric,
  	"url_destino" varchar,
  	"vigencia_desde" timestamp(3) with time zone,
  	"vigencia_hasta" timestamp(3) with time zone,
  	"estado" "enum_promociones_estado" DEFAULT 'activa',
  	"destacada" boolean DEFAULT false,
  	"origen" "enum_promociones_origen" DEFAULT 'manual',
  	"clave_externa" varchar,
  	"huella" varchar,
  	"visto_por_ultima_vez" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_promociones_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "promociones_locales" (
  	"titulo" varchar,
  	"slug" varchar,
  	"oferta" varchar,
  	"resumen" varchar,
  	"rollover" varchar,
  	"deposito_minimo" varchar,
  	"tope_de_conversion" varchar,
  	"puntos_clave" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_promociones_v_version_verticales" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__promociones_v_version_verticales",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_promociones_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_plataforma_id" integer,
  	"version_tipo" "enum__promociones_v_version_tipo",
  	"version_portada_id" integer,
  	"version_imagen_origen" varchar,
  	"version_cuota_minima" numeric,
  	"version_dias_para_cumplir" numeric,
  	"version_usos_por_usuario" numeric,
  	"version_combinable" "enum__promociones_v_version_combinable",
  	"version_activacion" "enum__promociones_v_version_activacion",
  	"version_codigo" varchar,
  	"version_juegos_habilitados" numeric,
  	"version_url_destino" varchar,
  	"version_vigencia_desde" timestamp(3) with time zone,
  	"version_vigencia_hasta" timestamp(3) with time zone,
  	"version_estado" "enum__promociones_v_version_estado" DEFAULT 'activa',
  	"version_destacada" boolean DEFAULT false,
  	"version_origen" "enum__promociones_v_version_origen" DEFAULT 'manual',
  	"version_clave_externa" varchar,
  	"version_huella" varchar,
  	"version_visto_por_ultima_vez" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__promociones_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__promociones_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_promociones_v_locales" (
  	"version_titulo" varchar,
  	"version_slug" varchar,
  	"version_oferta" varchar,
  	"version_resumen" varchar,
  	"version_rollover" varchar,
  	"version_deposito_minimo" varchar,
  	"version_tope_de_conversion" varchar,
  	"version_puntos_clave" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "plataformas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"logo_id" integer,
  	"url_sitio" varchar,
  	"url_promociones" varchar NOT NULL,
  	"url_api" varchar,
  	"adaptador" "enum_plataformas_adaptador" NOT NULL,
  	"scrapeo_activo" boolean DEFAULT true,
  	"ultima_corrida" timestamp(3) with time zone,
  	"ultimo_resultado" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "plataformas_locales" (
  	"slug" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"imagen_escritorio_id" integer NOT NULL,
  	"imagen_telefono_id" integer NOT NULL,
  	"orden" numeric DEFAULT 0 NOT NULL,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "banners_locales" (
  	"mensaje" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "banners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"plataformas_id" integer,
  	"promociones_id" integer
  );
  
  CREATE TABLE "puntos_de_venta" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"tipo" "enum_puntos_de_venta_tipo" DEFAULT 'sala' NOT NULL,
  	"direccion" varchar NOT NULL,
  	"localidad" varchar NOT NULL,
  	"provincia" "enum_puntos_de_venta_provincia" NOT NULL,
  	"latitud" numeric NOT NULL,
  	"longitud" numeric NOT NULL,
  	"telefono" varchar,
  	"horarios" varchar,
  	"foto_id" integer,
  	"codigo_externo" varchar,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefix" varchar DEFAULT 'media',
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"epigrafe" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"rol" "enum_users_rol" DEFAULT 'autor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer
  );
  
  CREATE TABLE "search" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"priority" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_locales" (
  	"title" varchar,
  	"resumen" varchar,
  	"slug" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"tags_id" integer,
  	"authors_id" integer,
  	"promociones_id" integer,
  	"plataformas_id" integer,
  	"banners_id" integer,
  	"puntos_de_venta_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"redirects_id" integer,
  	"search_id" integer,
  	"payload_folders_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "posts" ADD CONSTRAINT "posts_portada_id_media_id_fk" FOREIGN KEY ("portada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_categoria_id_categories_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_autor_id_authors_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_portada_id_media_id_fk" FOREIGN KEY ("version_portada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_categoria_id_categories_id_fk" FOREIGN KEY ("version_categoria_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_autor_id_authors_id_fk" FOREIGN KEY ("version_autor_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_credenciales" ADD CONSTRAINT "authors_credenciales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_credenciales_locales" ADD CONSTRAINT "authors_credenciales_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors_credenciales"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_enlaces" ADD CONSTRAINT "authors_enlaces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors_locales" ADD CONSTRAINT "authors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promociones_verticales" ADD CONSTRAINT "promociones_verticales_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."promociones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promociones" ADD CONSTRAINT "promociones_plataforma_id_plataformas_id_fk" FOREIGN KEY ("plataforma_id") REFERENCES "public"."plataformas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promociones" ADD CONSTRAINT "promociones_portada_id_media_id_fk" FOREIGN KEY ("portada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promociones_locales" ADD CONSTRAINT "promociones_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promociones_locales" ADD CONSTRAINT "promociones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."promociones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_promociones_v_version_verticales" ADD CONSTRAINT "_promociones_v_version_verticales_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_promociones_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_promociones_v" ADD CONSTRAINT "_promociones_v_parent_id_promociones_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."promociones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_promociones_v" ADD CONSTRAINT "_promociones_v_version_plataforma_id_plataformas_id_fk" FOREIGN KEY ("version_plataforma_id") REFERENCES "public"."plataformas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_promociones_v" ADD CONSTRAINT "_promociones_v_version_portada_id_media_id_fk" FOREIGN KEY ("version_portada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_promociones_v_locales" ADD CONSTRAINT "_promociones_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_promociones_v_locales" ADD CONSTRAINT "_promociones_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_promociones_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "plataformas" ADD CONSTRAINT "plataformas_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "plataformas_locales" ADD CONSTRAINT "plataformas_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plataformas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_imagen_escritorio_id_media_id_fk" FOREIGN KEY ("imagen_escritorio_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_imagen_telefono_id_media_id_fk" FOREIGN KEY ("imagen_telefono_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banners_locales" ADD CONSTRAINT "banners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners_rels" ADD CONSTRAINT "banners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners_rels" ADD CONSTRAINT "banners_rels_plataformas_fk" FOREIGN KEY ("plataformas_id") REFERENCES "public"."plataformas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners_rels" ADD CONSTRAINT "banners_rels_promociones_fk" FOREIGN KEY ("promociones_id") REFERENCES "public"."promociones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "puntos_de_venta" ADD CONSTRAINT "puntos_de_venta_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_locales" ADD CONSTRAINT "search_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promociones_fk" FOREIGN KEY ("promociones_id") REFERENCES "public"."promociones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plataformas_fk" FOREIGN KEY ("plataformas_id") REFERENCES "public"."plataformas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_puntos_de_venta_fk" FOREIGN KEY ("puntos_de_venta_id") REFERENCES "public"."puntos_de_venta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_portada_idx" ON "posts" USING btree ("portada_id");
  CREATE INDEX "posts_categoria_idx" ON "posts" USING btree ("categoria_id");
  CREATE INDEX "posts_autor_idx" ON "posts" USING btree ("autor_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts_locales" USING btree ("slug","_locale");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_tags_id_idx" ON "posts_rels" USING btree ("tags_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_portada_idx" ON "_posts_v" USING btree ("version_portada_id");
  CREATE INDEX "_posts_v_version_version_categoria_idx" ON "_posts_v" USING btree ("version_categoria_id");
  CREATE INDEX "_posts_v_version_version_autor_idx" ON "_posts_v" USING btree ("version_autor_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_snapshot_idx" ON "_posts_v" USING btree ("snapshot");
  CREATE INDEX "_posts_v_published_locale_idx" ON "_posts_v" USING btree ("published_locale");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_posts_v_locales_locale_parent_id_unique" ON "_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_tags_id_idx" ON "_posts_v_rels" USING btree ("tags_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories_locales" USING btree ("slug","_locale");
  CREATE INDEX "categories_meta_meta_image_idx" ON "categories_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "authors_credenciales_order_idx" ON "authors_credenciales" USING btree ("_order");
  CREATE INDEX "authors_credenciales_parent_id_idx" ON "authors_credenciales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "authors_credenciales_locales_locale_parent_id_unique" ON "authors_credenciales_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "authors_enlaces_order_idx" ON "authors_enlaces" USING btree ("_order");
  CREATE INDEX "authors_enlaces_parent_id_idx" ON "authors_enlaces" USING btree ("_parent_id");
  CREATE INDEX "authors_foto_idx" ON "authors" USING btree ("foto_id");
  CREATE INDEX "authors_usuario_idx" ON "authors" USING btree ("usuario_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "authors_locales_locale_parent_id_unique" ON "authors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "promociones_verticales_order_idx" ON "promociones_verticales" USING btree ("order");
  CREATE INDEX "promociones_verticales_parent_idx" ON "promociones_verticales" USING btree ("parent_id");
  CREATE INDEX "promociones_plataforma_idx" ON "promociones" USING btree ("plataforma_id");
  CREATE INDEX "promociones_tipo_idx" ON "promociones" USING btree ("tipo");
  CREATE INDEX "promociones_portada_idx" ON "promociones" USING btree ("portada_id");
  CREATE INDEX "promociones_vigencia_hasta_idx" ON "promociones" USING btree ("vigencia_hasta");
  CREATE INDEX "promociones_estado_idx" ON "promociones" USING btree ("estado");
  CREATE INDEX "promociones_clave_externa_idx" ON "promociones" USING btree ("clave_externa");
  CREATE INDEX "promociones_updated_at_idx" ON "promociones" USING btree ("updated_at");
  CREATE INDEX "promociones_created_at_idx" ON "promociones" USING btree ("created_at");
  CREATE INDEX "promociones__status_idx" ON "promociones" USING btree ("_status");
  CREATE UNIQUE INDEX "promociones_slug_idx" ON "promociones_locales" USING btree ("slug","_locale");
  CREATE INDEX "promociones_meta_meta_image_idx" ON "promociones_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "promociones_locales_locale_parent_id_unique" ON "promociones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_promociones_v_version_verticales_order_idx" ON "_promociones_v_version_verticales" USING btree ("order");
  CREATE INDEX "_promociones_v_version_verticales_parent_idx" ON "_promociones_v_version_verticales" USING btree ("parent_id");
  CREATE INDEX "_promociones_v_parent_idx" ON "_promociones_v" USING btree ("parent_id");
  CREATE INDEX "_promociones_v_version_version_plataforma_idx" ON "_promociones_v" USING btree ("version_plataforma_id");
  CREATE INDEX "_promociones_v_version_version_tipo_idx" ON "_promociones_v" USING btree ("version_tipo");
  CREATE INDEX "_promociones_v_version_version_portada_idx" ON "_promociones_v" USING btree ("version_portada_id");
  CREATE INDEX "_promociones_v_version_version_vigencia_hasta_idx" ON "_promociones_v" USING btree ("version_vigencia_hasta");
  CREATE INDEX "_promociones_v_version_version_estado_idx" ON "_promociones_v" USING btree ("version_estado");
  CREATE INDEX "_promociones_v_version_version_clave_externa_idx" ON "_promociones_v" USING btree ("version_clave_externa");
  CREATE INDEX "_promociones_v_version_version_updated_at_idx" ON "_promociones_v" USING btree ("version_updated_at");
  CREATE INDEX "_promociones_v_version_version_created_at_idx" ON "_promociones_v" USING btree ("version_created_at");
  CREATE INDEX "_promociones_v_version_version__status_idx" ON "_promociones_v" USING btree ("version__status");
  CREATE INDEX "_promociones_v_created_at_idx" ON "_promociones_v" USING btree ("created_at");
  CREATE INDEX "_promociones_v_updated_at_idx" ON "_promociones_v" USING btree ("updated_at");
  CREATE INDEX "_promociones_v_snapshot_idx" ON "_promociones_v" USING btree ("snapshot");
  CREATE INDEX "_promociones_v_published_locale_idx" ON "_promociones_v" USING btree ("published_locale");
  CREATE INDEX "_promociones_v_latest_idx" ON "_promociones_v" USING btree ("latest");
  CREATE INDEX "_promociones_v_version_version_slug_idx" ON "_promociones_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_promociones_v_version_meta_version_meta_image_idx" ON "_promociones_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_promociones_v_locales_locale_parent_id_unique" ON "_promociones_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "plataformas_logo_idx" ON "plataformas" USING btree ("logo_id");
  CREATE INDEX "plataformas_updated_at_idx" ON "plataformas" USING btree ("updated_at");
  CREATE INDEX "plataformas_created_at_idx" ON "plataformas" USING btree ("created_at");
  CREATE UNIQUE INDEX "plataformas_slug_idx" ON "plataformas_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "plataformas_locales_locale_parent_id_unique" ON "plataformas_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "banners_imagen_escritorio_idx" ON "banners" USING btree ("imagen_escritorio_id");
  CREATE INDEX "banners_imagen_telefono_idx" ON "banners" USING btree ("imagen_telefono_id");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE UNIQUE INDEX "banners_locales_locale_parent_id_unique" ON "banners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "banners_rels_order_idx" ON "banners_rels" USING btree ("order");
  CREATE INDEX "banners_rels_parent_idx" ON "banners_rels" USING btree ("parent_id");
  CREATE INDEX "banners_rels_path_idx" ON "banners_rels" USING btree ("path");
  CREATE INDEX "banners_rels_plataformas_id_idx" ON "banners_rels" USING btree ("plataformas_id");
  CREATE INDEX "banners_rels_promociones_id_idx" ON "banners_rels" USING btree ("promociones_id");
  CREATE INDEX "puntos_de_venta_foto_idx" ON "puntos_de_venta" USING btree ("foto_id");
  CREATE UNIQUE INDEX "puntos_de_venta_codigo_externo_idx" ON "puntos_de_venta" USING btree ("codigo_externo");
  CREATE INDEX "puntos_de_venta_updated_at_idx" ON "puntos_de_venta" USING btree ("updated_at");
  CREATE INDEX "puntos_de_venta_created_at_idx" ON "puntos_de_venta" USING btree ("created_at");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_posts_id_idx" ON "redirects_rels" USING btree ("posts_id");
  CREATE INDEX "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE INDEX "search_slug_idx" ON "search_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "search_locales_locale_parent_id_unique" ON "search_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX "search_rels_posts_id_idx" ON "search_rels" USING btree ("posts_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_promociones_id_idx" ON "payload_locked_documents_rels" USING btree ("promociones_id");
  CREATE INDEX "payload_locked_documents_rels_plataformas_id_idx" ON "payload_locked_documents_rels" USING btree ("plataformas_id");
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX "payload_locked_documents_rels_puntos_de_venta_id_idx" ON "payload_locked_documents_rels" USING btree ("puntos_de_venta_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_locales" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_locales" CASCADE;
  DROP TABLE "authors_credenciales" CASCADE;
  DROP TABLE "authors_credenciales_locales" CASCADE;
  DROP TABLE "authors_enlaces" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "authors_locales" CASCADE;
  DROP TABLE "promociones_verticales" CASCADE;
  DROP TABLE "promociones" CASCADE;
  DROP TABLE "promociones_locales" CASCADE;
  DROP TABLE "_promociones_v_version_verticales" CASCADE;
  DROP TABLE "_promociones_v" CASCADE;
  DROP TABLE "_promociones_v_locales" CASCADE;
  DROP TABLE "plataformas" CASCADE;
  DROP TABLE "plataformas_locales" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "banners_locales" CASCADE;
  DROP TABLE "banners_rels" CASCADE;
  DROP TABLE "puntos_de_venta" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "redirects_rels" CASCADE;
  DROP TABLE "search" CASCADE;
  DROP TABLE "search_locales" CASCADE;
  DROP TABLE "search_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum__posts_v_published_locale";
  DROP TYPE "public"."enum_promociones_verticales";
  DROP TYPE "public"."enum_promociones_tipo";
  DROP TYPE "public"."enum_promociones_combinable";
  DROP TYPE "public"."enum_promociones_activacion";
  DROP TYPE "public"."enum_promociones_estado";
  DROP TYPE "public"."enum_promociones_origen";
  DROP TYPE "public"."enum_promociones_status";
  DROP TYPE "public"."enum__promociones_v_version_verticales";
  DROP TYPE "public"."enum__promociones_v_version_tipo";
  DROP TYPE "public"."enum__promociones_v_version_combinable";
  DROP TYPE "public"."enum__promociones_v_version_activacion";
  DROP TYPE "public"."enum__promociones_v_version_estado";
  DROP TYPE "public"."enum__promociones_v_version_origen";
  DROP TYPE "public"."enum__promociones_v_version_status";
  DROP TYPE "public"."enum__promociones_v_published_locale";
  DROP TYPE "public"."enum_plataformas_adaptador";
  DROP TYPE "public"."enum_puntos_de_venta_tipo";
  DROP TYPE "public"."enum_puntos_de_venta_provincia";
  DROP TYPE "public"."enum_users_rol";
  DROP TYPE "public"."enum_redirects_to_type";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
