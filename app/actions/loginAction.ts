"use server";
import { loginSchema } from "@/app/lib/zod-schemas";
import { apiBaseUrl } from "@/app/lib/apiBase";
import { apiService } from "@/app/services/api";
import { cookies } from "next/headers";

type SessionPayload = {
  token?: string;
  refreshToken?: string;
  tenant?: { id?: string };
  user?: { name?: string };
};

/**
 * Stores the session once the API finally issued a token (with or without the
 * MFA step).
 *
 * Delegates to `storeSession` so the refresh token is kept and the access-token
 * cookie expires when the token does. The previous version dropped the refresh
 * token and gave the access token a 7-day cookie, so the app appeared signed in
 * for a week while every API call failed after an hour.
 */
async function persistSession(result: SessionPayload) {
  const { storeSession } = await import("@/app/lib/session");
  const cookieStore = await cookies();
  if (result.user?.name) {
    cookieStore.set("user_name", result.user.name, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  await storeSession(result);
}

export async function loginAction(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: "يرجى التحقق من البيانات المدخلة",
    };
  }

  try {
    const response = await apiService.login(validated.data);
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "فشل تسجيل الدخول. تأكد من البيانات",
      };
    }

    // MFA enabled: the API returns a 5-minute challenge instead of a session.
    if (result.mfaRequired) {
      return {
        success: false,
        mfaRequired: true,
        challengeToken: result.challengeToken as string,
        message: "أدخل رمز التحقق من تطبيق المصادقة",
      };
    }

    await persistSession(result);
    return { success: true, message: "تم تسجيل الدخول بنجاح" };
  } catch (error) {
    return { success: false, message: "خطأ في الاتصال بالخادم" };
  }
}

/** Step 2 of the login flow: exchanges the TOTP code for a session. */
export async function mfaVerifyAction(prevState: any, formData: FormData) {
  const challengeToken = String(formData.get("challengeToken") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");

  if (!/^\d{6}$/.test(code)) {
    return { success: false, mfaRequired: true, challengeToken, message: "الرمز يجب أن يتكون من 6 أرقام" };
  }

  try {
    const response = await fetch(`${apiBaseUrl()}/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken, code }),
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const expired = result?.error_code === "MFA_CHALLENGE_EXPIRED";
      return {
        success: false,
        mfaRequired: !expired,
        challengeToken: expired ? "" : challengeToken,
        message: result?.message || "رمز غير صالح",
      };
    }

    await persistSession(result);
    return { success: true, message: "تم التحقق بنجاح" };
  } catch {
    return { success: false, mfaRequired: true, challengeToken, message: "خطأ في الاتصال بالخادم" };
  }
}
