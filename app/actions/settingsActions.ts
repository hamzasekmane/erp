"use server";

import { settingsService } from "@/app/services/settingsService";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { apiService } from "@/app/services/api";
async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || "";
}

// 1. تحديث بيانات الشركة الشامل (Identity + Address + Billing)
export async function updateCompanyAction(_prevState: any, formData: FormData) {
  const token = await getAuthToken();
  const rawData = Object.fromEntries(formData.entries());
  
  const formattedData = {
    name: rawData.name,
    businessName: rawData.businessName,
    taxNumber: rawData.taxNumber,
    tvaIntra: rawData.tvaIntra,
    address: {
      street: rawData.street,
      city: rawData.city,
      country: rawData.country || "France",
      postalCode: rawData.postalCode,
    },
    contact: {
      phone: rawData.phone,
      email: rawData.email, // تأكد أن هذا الحقل موجود في الـ Form
    },
    settings: {
      invoice: {
        prefix: rawData.prefix,
        nextNumber: Number(rawData.nextNumber),
      },
      tax: {
        defaultVat: Number(rawData.defaultVat),
      }
    }
  };

  // الآن أرسل البيانات للسيرفر
  return await settingsService.updateTenant(formattedData, token);
}

// // 2. تغيير كلمة المرور
// export async function updateSecurityAction(_prevState: any, formData: FormData) {
//   const token = await getAuthToken();
//   const data = Object.fromEntries(formData.entries());
//   const res = await settingsService.changePassword(data, token);
//   return { success: !!res.success, message: res.message };
// }
export async function requestPasswordResetAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  
  // Appel du service
  const res = await apiService.requestReset(email);
  
  if (!res.success) {
    return { success: false, message: res.error };
  }

  return { 
    success: true, 
    message: "Vérifiez votre boîte mail pour continuer." 
  };
}
// 3. تغيير حالة الفرع
export async function toggleTenantStatusAction(tenantId: string, currentStatus: string) {
  const token = await getAuthToken();
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  const res = await settingsService.updateTenantStatus(tenantId, newStatus, token);
  if (res.success) revalidatePath("/dashboard/settings/tenants");
  return { success: !!res.success, message: res.message };
}
export async function uploadLogoAction(formData: FormData) {
  const token = await getAuthToken();
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenant/logo`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData, // نرسل الـ FormData مباشرة (Multer سيتعامل معها)
    });
    const data = await res.json();
    if (data.success) {
      revalidatePath("/dashboard/settings/company");
      return { success: true, logo: data.logo };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: "Upload failed" };
  }
}