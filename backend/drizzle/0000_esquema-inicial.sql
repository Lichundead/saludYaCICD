CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"telefono" text,
	"tipo_id" text,
	"numero_id" text,
	"rh" text,
	"rol" text DEFAULT 'paciente' NOT NULL,
	"especialidad" text,
	"licencia" text,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email"),
	CONSTRAINT "usuarios_rol_valido" CHECK ("usuarios"."rol" IN ('paciente', 'medico', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "citas" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"medico_id" integer NOT NULL,
	"especialidad" text NOT NULL,
	"fecha" date NOT NULL,
	"hora" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	CONSTRAINT "citas_estado_valido" CHECK ("citas"."estado" IN ('pendiente', 'confirmada', 'rechazada', 'atendida'))
);
--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_usuarios_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_medico_id_usuarios_id_fk" FOREIGN KEY ("medico_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "citas_medico_horario_unico" ON "citas" USING btree ("medico_id","fecha","hora");