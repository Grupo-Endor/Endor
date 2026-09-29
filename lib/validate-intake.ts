import { z } from "zod";
import type { DiagnosisIntake } from "@/types/diagnosis";
import { SECTORS } from "@/lib/sectors";

const sectorIds = SECTORS.map((s) => s.id) as [string, ...string[]];

export const intakeSchema = z.object({
  contact: z.object({
    full_name: z.string().min(2),
    role: z.string().min(1),
    company: z.string().min(1),
    work_email: z.string().email(),
    whatsapp: z.string().min(8),
  }),
  identity: z.object({
    logo_filename: z.string().optional(),
    logo_data_url: z.string().optional(),
    colors: z.string().min(1),
    fonts: z.string().min(1),
  }),
  presence: z
    .object({
      website: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .refine(
      (p) =>
        Boolean(
          p.website || p.instagram || p.facebook || p.tiktok || p.linkedin
        ),
      { message: "Se requiere al menos un canal de presencia digital" }
    ),
  scope: z.object({
    sector: z.enum(sectorIds),
    city: z.string().min(2),
    reach: z.enum(["local", "nacional", "exportacion"]),
  }),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().optional(),
      })
    )
    .min(3)
    .max(5),
  intention: z.object({
    feel: z.string().min(3),
    not_for: z.string().min(3),
    distinct: z.string().min(3),
  }),
  optional: z
    .object({
      recent_posts: z.string().optional(),
      physical_materials: z.string().optional(),
      client_words: z.string().optional(),
    })
    .optional(),
});

export function parseIntake(body: unknown): DiagnosisIntake {
  return intakeSchema.parse(body) as DiagnosisIntake;
}
