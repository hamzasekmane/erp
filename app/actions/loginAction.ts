"use server";
import { loginSchema } from "@/app/lib/zod-schemas";
import { apiService } from "@/app/services/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    
    // 1. Store the JWT (HTTP-Only for security)
    cookieStore.set("token", result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // 2. Store Tenant ID for context
    if (result.tenant?.id) {
      cookieStore.set("tenantId", result.tenant.id, {
        secure: isProd,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // 3. Store basic User info for UI
    if (result.user) {
      cookieStore.set("user_name", result.user.name, {
        secure: isProd,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return { success: true, message: "تم تسجيل الدخول بنجاح" };
  } catch (error) {
    return { success: false, message: "خطأ في الاتصال بالخادم" };
  }
}