"use server";

import { productsService } from "@/app/services/products.Service";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// دالة مساعدة مركزية للتحقق من التوكن
async function getAuthTokenOrThrow() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw new Error("AUTH_REQUIRED");
  return token;
}

/**
 * أكشن: إضافة منتج جديد
 */
export async function createProductAction(_prevState: any, formData: FormData) {
  let token: string;
  try {
    token = await getAuthTokenOrThrow();
  } catch {
    return { success: false, message: "Session expirée. Veuillez vous reconnecter." };
  }

  const productData = {
    name: formData.get("name")?.toString().trim(),
    code: formData.get("code")?.toString().trim(),
    categoryId: formData.get("categoryId")?.toString(),
    price: Number(formData.get("price")) || 0,
    stock: Number(formData.get("stock")) || 0,
    minStock: Number(formData.get("minStock")) || 0,
    
    // ✅ إضافة هذه الحقول المفقودة
    unit: formData.get("unit")?.toString() || "piece", // نقرأها من الفورم
    status: formData.get("status")?.toString() || "active", // نقرأها من الفورم
    taxId: formData.get("taxId")?.toString() || undefined, // نرسل الضريبة إن وجدت
  };

  try {
    const res = await productsService.createProduct(productData, token);

    // التحقق الشامل من نجاح الباك إيند
    const isOk = res && (res.success || res._id || res.status === "success" || res.data?._id);

    if (!isOk) {
      return { success: false, message: res.message || "Données invalides ou erreur serveur" };
    }

    // تحديث الكاش لضمان ظهور المنتج فوراً في الجداول
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard"); // تحديث الإحصائيات في الصفحة الرئيسية إن وجدت
    
  } catch (err: any) {
    return { success: false, message: "Erreur réseau : " + (err.message || "Inconnue") };
  }

  // الـ redirect يجب أن يكون دائماً في نهاية الدالة خارج الـ try/catch
  redirect("/dashboard/products");
}

/**
 * أكشن: تحديث بيانات منتج
 */
export async function updateProductAction(id: string, prevState: any, formData: FormData) {
  try {
    const token = await getAuthTokenOrThrow();
    
    const rawData = {
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString(),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      minStock: Number(formData.get("minStock")),
      unit: formData.get("unit")?.toString(),
      status: formData.get("status")?.toString(),
    };

    const res = await productsService.updateProduct(id, rawData, token);

    if (res && (res.success || res.status === "success" || res._id)) {
      revalidatePath("/dashboard/products");
      revalidatePath(`/dashboard/products/${id}`); // تحديث صفحة العرض Show
      return { success: true, message: "Mise à jour effectuée avec succès !" };
    }

    return { success: false, message: res.message || "Échec de la modification" };
  } catch (error: any) {
    if (error.message === "AUTH_REQUIRED") return { success: false, message: "Session expirée" };
    return { success: false, message: "Erreur de connexion" };
  }
}

/**
 * أكشن: تغيير الحالة (Toggle)
 */
export async function toggleProductStatusAction(id: string, currentStatus: string) {
  try {
    const token = await getAuthTokenOrThrow();
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const res = await productsService.updateProduct(id, { status: newStatus }, token);

    if (res?.success || res?.status === "success") {
      revalidatePath("/dashboard/products");
      return { success: true, message: `Produit désormais ${newStatus}` };
    }
    return { success: false, message: "Impossible de changer le statut" };
  } catch {
    return { success: false, message: "Erreur technique" };
  }
}

/**
 * أكشن: الحذف
 */
export async function deleteProductAction(id: string) {
  try {
    const token = await getAuthTokenOrThrow();
    const res = await productsService.deleteProduct(id, token);

    if (res?.success || res?.status === "success") {
      revalidatePath("/dashboard/products");
      return { success: true, message: "Supprimé avec succès" };
    }
    return { success: false, message: res.message || "Erreur lors de la suppression" };
  } catch {
    return { success: false, message: "Erreur de connexion" };
  }
}