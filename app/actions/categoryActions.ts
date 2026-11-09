"use server";

import { productsService } from "@/app/services/products.Service";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || "";
}

export async function createCategoryAction(prevState: any, formData: FormData) {
  const token = await getAuthToken();
  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    type: "product",
    color: (formData.get("color") as string) || "#0891b2",
    icon: "tag",
    isActive: true,
  };

  try {
    const res = await productsService.createCategory(rawData, token);
    if (res.success) {
      revalidatePath("/dashboard/categories");
      return { success: true, message: "Catégorie créée avec succès !" };
    }
    return { success: false, message: res.message || "Erreur Backend" };
  } catch (err) {
    return { success: false, message: "Erreur de connexion au serveur" };
  }
}

export async function updateCategoryAction(id: string, prevState: any, formData: FormData) {
  // 1. جلب التوكن (إما من FormData أو من الكوكيز)
  const tokenFromForm = formData.get("token") as string;
  const token = tokenFromForm || (await getAuthToken());

  const rawData = {
    name: formData.get("name")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
    color: formData.get("color")?.toString() || "#0891b2",
  };

  try {
    // 2. استدعاء الخدمة (تأكد أن الخدمة تستخدم PATCH أو PUT حسب الباك إيند)
    const result = await productsService.updateCategory(id, rawData, token);

    if (result.success) {
      revalidatePath("/dashboard/categories");
      return { success: true, message: "Mise à jour réussie !" };
    }
    return { success: false, message: result.message || "Échec de la mise à jour" };
  } catch (error) {
    return { success: false, message: "Erreur de connexion au serveur" };
  }
}

// التعديل هنا: إضافة token كوسيط ثانٍ اختيارياً لإصلاح خطأ TypeScript
export async function deleteCategoryAction(id: string, tokenFromClient?: string) {
  // نستخدم التوكن الممرر أو نجلب التوكن من الكوكيز كخيار احتياطي
  const token = tokenFromClient || await getAuthToken();

  try {
    const res = await productsService.deleteCategory(id, token);
    
    if (!res.success) {
      return { 
        success: false, 
        message: res.message || "Action refusée par le serveur" 
      };
    }
    
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || "Erreur réseau" 
    };
  }
}