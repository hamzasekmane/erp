import { z } from "zod";

export const ROLES = ["tenant_admin", "manager", "user"] as const;

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(ROLES).default("user"),
  phone: z.string().max(40).optional(),
  department: z.string().max(80).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(ROLES).optional(),
  phone: z.string().max(40).nullish(),
  department: z.string().max(80).nullish(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  avatarUrl: z.string().max(2000).nullish(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).nullish(),
  department: z.string().max(80).nullish(),
  avatarUrl: z.string().max(2000).nullish(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(200),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
