CREATE TABLE "disponibilidad" (
	"id" serial PRIMARY KEY NOT NULL,
	"medico_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"hora_inicio" text NOT NULL,
	"hora_fin" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "debe_cambiar_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_medico_id_usuarios_id_fk" FOREIGN KEY ("medico_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "disponibilidad_bloque_unico" ON "disponibilidad" USING btree ("medico_id","fecha","hora_inicio");