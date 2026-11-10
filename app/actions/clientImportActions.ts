"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const API_URL = apiBaseUrl();

/**
 * Récupère les headers d'authentification centralisés
 */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return {
    "Authorization": `Bearer ${token}`,
  };
}

type ActionResponse = {
  success?: boolean;
  error?: string;
  data?: any;
  stats?: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
};

/**
 * Importer des clients depuis un fichier (Server Action)
 */
export async function importClientsAction(formData: FormData): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  const file = formData.get("file") as File;
  const updateExisting = formData.get("updateExisting") === "true";
  const skipDuplicates = formData.get("skipDuplicates") === "true";
  const sendNotifications = formData.get("sendNotifications") === "true";

  if (!file) {
    return { error: "Aucun fichier sélectionné" };
  }

  // Vérifier le type de fichier
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { error: "Type de fichier non supporté. Utilisez .xlsx, .xls ou .csv" };
  }

  // Vérifier la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Le fichier ne doit pas dépasser 10MB" };
  }

  try {
    // Créer un nouveau FormData pour l'envoi
    const apiFormData = new FormData();
    apiFormData.append("file", file);
    apiFormData.append("updateExisting", String(updateExisting));
    apiFormData.append("skipDuplicates", String(skipDuplicates));
    apiFormData.append("sendNotifications", String(sendNotifications));

    const res = await fetch(`${API_URL}/clients/import`, {
      method: "POST",
      headers: {
        "Authorization": headers.Authorization,
      },
      body: apiFormData,
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(" Erreur API:", result);
      return { 
        error: result.message || "Erreur lors de l'importation",
        stats: result.stats
      };
    }

    // Revalider les pages concernées
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/clients/import/history");

    return { 
      success: true, 
      data: result.data,
      stats: result.stats 
    };
    
  } catch (error) {
    console.error(" Erreur réseau:", error);
    return { error: "Impossible de contacter le serveur" };
  }
}

/**
 * Télécharger le modèle Excel (Server Action)
 */
export async function downloadTemplateAction(): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API_URL}/clients/import/template`, {
      headers: {
        "Authorization": headers.Authorization,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Erreur lors du téléchargement" }));
      return { error: error.message || "Erreur lors du téléchargement" };
    }

    // Récupérer le nom du fichier depuis l'en-tête
    const contentDisposition = res.headers.get("Content-Disposition");
    let filename = "modele_clients.xlsx";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    // Convertir la réponse en blob
    const blob = await res.blob();
    
    // Retourner les données pour le téléchargement côté client
    return {
      success: true,
      data: {
        blob: blob,
        filename: filename,
        contentType: res.headers.get("Content-Type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    };
    
  } catch (error) {
    console.error(" Erreur téléchargement modèle:", error);
    return { error: "Erreur lors du téléchargement" };
  }
}

/**
 * Valider un fichier avant import (Server Action)
 */
export async function validateImportFileAction(formData: FormData): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  const file = formData.get("file") as File;

  if (!file) {
    return { error: "Aucun fichier sélectionné" };
  }

  try {
    const apiFormData = new FormData();
    apiFormData.append("file", file);

    const res = await fetch(`${API_URL}/clients/import/validate`, {
      method: "POST",
      headers: {
        "Authorization": headers.Authorization,
      },
      body: apiFormData,
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.message || "Erreur de validation" };
    }

    return { success: true, data: result };
    
  } catch (error) {
    console.error(" Erreur validation:", error);
    return { error: "Erreur de connexion" };
  }
}

/**
 * Obtenir l'historique des imports (Server Action)
 */
export async function getImportHistoryAction(page = 1, limit = 10): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API_URL}/clients/import/history?page=${page}&limit=${limit}`, {
      headers: {
        "Authorization": headers.Authorization,
        "Content-Type": "application/json"
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération de l'historique" };
    }

    const result = await res.json();
    return { success: true, data: result };
    
  } catch (error) {
    console.error(" Erreur historique:", error);
    return { error: "Erreur de connexion" };
  }
}

/**
 * Annuler un import en cours (Server Action)
 */
export async function cancelImportAction(importId: string): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API_URL}/clients/import/${importId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": headers.Authorization,
        "Content-Type": "application/json"
      },
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.message || "Erreur lors de l'annulation" };
    }

    revalidatePath("/dashboard/clients/import/history");
    return { success: true };
    
  } catch (error) {
    console.error(" Erreur annulation import:", error);
    return { error: "Erreur de connexion" };
  }
}