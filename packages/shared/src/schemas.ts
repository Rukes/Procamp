import { z } from "zod";

export const createReservationSchema = z.object({
  accommodationTypeId: z.string(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  selectedSurchargeIds: z.array(z.string()),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  licensePlate: z.string().optional(),
  expectedArrival: z.string().optional(),
  note: z.string().optional(),
  languageCode: z.string().default("cs"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  isSuperAdmin: z.boolean().default(false),
  permissions: z.object({
    camps_view: z.boolean().default(false),
    camps_create: z.boolean().default(false),
    camps_edit: z.boolean().default(false),
    camps_delete: z.boolean().default(false),
    reservations_view: z.boolean().default(false),
    reservations_create: z.boolean().default(false),
    reservations_edit: z.boolean().default(false),
    reservations_delete: z.boolean().default(false),
    users_manage: z.boolean().default(false),
    templates_edit: z.boolean().default(false),
    settings_edit: z.boolean().default(false),
    org_admin: z.boolean().default(false),
    campIds: z.array(z.string()).optional(),
  }),
});

export const updateCampSchema = z.object({
  name: z.string().min(1).optional(),
  notificationEmail: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpReplyTo: z.string().optional(),
  requiresConfirmation: z.boolean().optional(),
  useCustomSmtp: z.boolean().optional(),
});

export const createSurchargeSchema = z.object({
  isOptional: z.boolean().default(true),
  translations: z.record(z.object({ name: z.string().min(1) })),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateCampInput = z.infer<typeof updateCampSchema>;
export type CreateSurchargeInput = z.infer<typeof createSurchargeSchema>;
