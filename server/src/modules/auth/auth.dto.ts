import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const addressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  })
  .partial()
  .optional();

export const registerSchema = z.object({
  tenantData: z.object({
    name: z.string().min(2, "Nom de l'entreprise requis"),
    businessName: z.string().min(2).optional(),
    taxNumber: z.string().optional(),
    domain: z.string().optional(),
    contact: z
      .object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
      .partial()
      .optional(),
    address: addressSchema,
    currency: z.string().length(3).optional(),
    language: z.string().min(2).max(5).optional(),
  }),
  userData: z.object({
    name: z.string().min(2, "Nom complet requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Mot de passe minimum 8 caractères"),
    phone: z.string().optional(),
    role: z.string().optional(),
  }),
  planCode: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* ------------------------------- MFA (TOTP) ------------------------------ */

const codeField = z.string().regex(/^\d{6}$/, "Code à 6 chiffres requis");

export const mfaCodeSchema = z.object({ code: codeField });
export const mfaVerifySchema = z.object({
  challengeToken: z.string().min(10, "Jeton de vérification requis"),
  code: codeField,
});
export const mfaDisableSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
  code: codeField,
});

export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type MfaDisableInput = z.infer<typeof mfaDisableSchema>;
