"use server";

import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { settingsService } from "@/app/services/settingsService";

export async function updateTenantAction(formData: FormData) {
  try {
    // ✅ Get token from cookies (Next.js 15 async syntax)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return { 
        success: false, 
        error: "Unauthorized: No token found" 
      };
    }

    const tenantId = formData.get("tenantId") as string;
    
    if (!tenantId) {
      return { 
        success: false, 
        error: "Tenant ID is required" 
      };
    }

    // ✅ Collect all form data
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'tenantId') {
        data[key] = value;
      }
    }

    // ✅ Use updateTenant (matches your service)
    const result = await settingsService.updateTenant(data, token);
    
    // ✅ Check for subscription expired error
    if (!result.success && result.error_code === "SUBSCRIPTION_EXPIRED") {
      return { 
        success: false, 
        error: "انتهت صلاحية الباقة، يرجى التجديد",
        error_code: "SUBSCRIPTION_EXPIRED",
        data: result.data
      };
    }
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || "حدث خطأ أثناء تحديث البيانات"
      };
    }
    
    // ✅ Revalidate the tenant page
    revalidatePath("/dashboard/tenant");
    
    return { 
      success: true, 
      message: "تم تحديث البيانات بنجاح",
      data: result 
    };
    
  } catch (error: any) {
    console.error("Error updating tenant:", error);
    
    return { 
      success: false, 
      error: error.message || "حدث خطأ أثناء تحديث البيانات"
    };
  }
}

export async function getTenantSettings() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return { 
        success: false, 
        error: "Unauthorized" 
      };
    }

    // ✅ Use getTenantInfo
    const data = await settingsService.getTenantInfo(token);
    
    // ✅ Check for subscription expired error
    if (!data.success && data.error_code === "SUBSCRIPTION_EXPIRED") {
      return { 
        success: false, 
        error: "Subscription expired",
        error_code: "SUBSCRIPTION_EXPIRED",
        data: data.data
      };
    }
    
    return { 
      success: true, 
      data 
    };
    
  } catch (error: any) {
    console.error("Error getting tenant settings:", error);
    
    return { 
      success: false, 
      error: error.message || "Failed to get settings"
    };
  }
}