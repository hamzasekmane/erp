"use server";

import { revalidatePath } from "next/cache";
import { taxService } from "@/app/services/taxService";

/**
 * --- CREATE TAX ACTION ---
 */
export async function createTaxAction(prevState: any, formData: FormData) {
  const token = formData.get("token") as string;
  const name = formData.get("name") as string;
  const rate = Number(formData.get("rate"));

  // Basic validation
  if (!name || isNaN(rate)) {
    return { success: false, message: "Données invalides : Nom et Taux requis." };
  }

  try {
    await taxService.createTax({ name, rate }, token);
    
    // Refresh the specific page to show new data
    revalidatePath("/dashboard/products/tax-rates");
    
    return { success: true, message: "Taxe ajoutée avec succès ! ✨" };
  } catch (error: any) {
    console.error("Create Tax Error:", error);
    return { 
      success: false, 
      message: error.message || "Erreur lors de la création de la taxe." 
    };
  }
}

/**
 * --- UPDATE TAX ACTION ---
 */
export async function updateTaxAction(id: string, prevState: any, formData: FormData) {
  const token = formData.get("token") as string;
  const name = formData.get("name") as string;
  const rate = Number(formData.get("rate"));

  if (!id || !name || isNaN(rate)) {
    return { success: false, message: "ID, Nom et Taux sont obligatoires." };
  }

  try {
    await taxService.updateTax(id, { name, rate }, token);
    
    revalidatePath("/dashboard/products/tax-rates");
    
    return { success: true, message: "Taxe mise à jour avec succès ! 🔄" };
  } catch (error: any) {
    console.error("Update Tax Error:", error);
    return { 
      success: false, 
      message: error.message || "Erreur lors de la modification." 
    };
  }
}

/**
 * --- DELETE TAX ACTION ---
 * Note: This doesn't use useActionState (usually triggered via onClick + startTransition)
 */
export async function deleteTaxAction(id: string, token: string) {
  if (!id || !token) {
    return { success: false, message: "Paramètres manquants pour la suppression." };
  }

  try {
    await taxService.deleteTax(id, token);
    
    // Immediately refresh the list
    revalidatePath("/dashboard/products/tax-rates");
    
    return { success: true, message: "Taxe supprimée." };
  } catch (error: any) {
    console.error("Delete Tax Error:", error);
    return { 
      success: false, 
      message: error.message || "Impossible de supprimer cette taxe." 
    };
  }
}