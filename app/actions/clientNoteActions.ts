"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Récupère les headers d'authentification centralisés
 */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

/**
 * Nettoie récursivement les données pour supprimer les chaînes vides
 */
function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, sanitizePayload(v)])
        .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
    );
  }
  
  return obj;
}

type ActionResponse = {
  success?: boolean;
  error?: string;
  data?: any;
};

/**
 * Créer une nouvelle note
 */
export async function createClientNoteAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const headers = await getAuthHeaders();
  
  const rawData = {
    title: formData.get("title"),
    content: formData.get("content") || undefined,
    clientId: formData.get("clientId"),
    category: formData.get("category") || "general",
    isPinned: formData.get("isPinned") === "true",
  };

  // Validation
  if (!rawData.title) {
    return { error: "Le titre de la note est requis" };
  }
  if (!rawData.clientId) {
    return { error: "Veuillez sélectionner un client" };
  }

  const payload = sanitizePayload(rawData);

  console.log("🔄 Création note - Payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(`${API_URL}/client-notes`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(" Erreur API:", result);
      
      if (res.status === 400) {
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((err: any) => 
            `${err.field || 'Champ'}: ${err.message}`
          ).join(', ');
          return { error: errorMessages };
        }
        return { error: result.message || "Données invalides" };
      }
      return { error: result.message || "Erreur lors de la création" };
    }

    revalidatePath("/dashboard/clients/notes");
    if (payload.clientId) {
      revalidatePath(`/dashboard/clients/${payload.clientId}`);
    }
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error(" Erreur réseau:", error);
    return { error: "Impossible de contacter le serveur" };
  }
}

/**
 * Mettre à jour une note
 */
export async function updateClientNoteAction(id: string, prevState: any, formData: FormData): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  if (!id) {
    return { error: "ID de la note manquant" };
  }

  const rawData = {
    title: formData.get("title") || undefined,
    content: formData.get("content") || undefined,
    category: formData.get("category") || undefined,
    isPinned: formData.get("isPinned") === "true" ? true : 
              formData.get("isPinned") === "false" ? false : undefined,
  };

  const payload = sanitizePayload(rawData);

  console.log("🔄 Mise à jour note - Payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(`${API_URL}/client-notes/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(" Erreur API:", result);
      
      if (res.status === 400) {
        return { error: result.message || "Données invalides" };
      }
      return { error: result.message || "Erreur lors de la mise à jour" };
    }

    revalidatePath("/dashboard/clients/notes");
    revalidatePath(`/dashboard/clients/notes/${id}`);
    if (result.data?.clientId) {
      revalidatePath(`/dashboard/clients/${result.data.clientId}`);
    }
    
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error(" Erreur réseau:", error);
    return { error: "Erreur de connexion lors de la mise à jour" };
  }
}

/**
 * Supprimer une note
 */
export async function deleteClientNoteAction(id: string): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  if (!id) {
    return { success: false, error: "ID de la note manquant" };
  }

  try {
    const res = await fetch(`${API_URL}/client-notes/${id}`, {
      method: "DELETE",
      headers,
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, error: result.message || "Suppression impossible" };
    }

    revalidatePath("/dashboard/clients/notes");
    return { success: true };
    
  } catch (error) {
    console.error(" Erreur suppression note:", error);
    return { success: false, error: "Erreur réseau lors de la suppression" };
  }
}

/**
 * Épingler/Désépingler une note
 */
export async function togglePinNoteAction(id: string, isPinned: boolean): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  if (!id) {
    return { success: false, error: "ID de la note manquant" };
  }

  try {
    const res = await fetch(`${API_URL}/client-notes/${id}/pin`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isPinned }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, error: result.message || "Erreur lors de l'opération" };
    }

    revalidatePath("/dashboard/clients/notes");
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error(" Erreur épinglage note:", error);
    return { success: false, error: "Erreur réseau" };
  }
}

/**
 * Récupérer une note par ID (pour les composants client)
 */
export async function getClientNoteByIdAction(id: string): Promise<ActionResponse> {
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API_URL}/client-notes/${id}`, {
      headers,
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, error: result.message || "Note non trouvée" };
    }

    return { success: true, data: result.data };
    
  } catch (error) {
    console.error(" Erreur récupération note:", error);
    return { success: false, error: "Erreur de connexion" };
  }
}