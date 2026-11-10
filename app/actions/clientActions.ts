"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_URL = apiBaseUrl();

/**
 * Récupère les headers d'authentification centralisés
 */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    throw new Error("Non authentifié");
  }
  
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
    // Garder l'objet address même s'il est partiellement vide
    if (obj.street || obj.city || obj.state || obj.postalCode) {
      return Object.fromEntries(
        Object.entries(obj)
          .map(([k, v]) => [k, sanitizePayload(v)])
          .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
      );
    }
    
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, sanitizePayload(v)])
        .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
    );
  }
  
  return obj;
}

/**
 * Valide et formate un numéro de téléphone
 */
function validatePhoneNumber(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  
  // Enlever tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Vérifier la longueur (attend 10 chiffres)
  if (cleaned.length === 10) {
    return cleaned;
  } else if (cleaned.length === 9) {
    // Ajouter un 0 au début si 9 chiffres
    return `0${cleaned}`;
  } else if (cleaned.length > 10) {
    // Prendre seulement les 10 derniers chiffres
    return cleaned.slice(-10);
  }
  
  // Si trop court, retourner undefined (ne pas envoyer)
  return undefined;
}

type ActionResponse = {
  message?: string;
  success?: boolean;
  error?: string;
  data?: any;
  subscriptionExpired?: boolean;
  redirectToLogin?: boolean;
};

/**
 * Créer un nouveau client
 */
export async function createClientAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();
    
    // Valider et formater les numéros de téléphone
    const rawPhone = formData.get("phone") as string | null;
    const rawMobile = formData.get("mobile") as string | null;
    
    const phone = validatePhoneNumber(rawPhone);
    const mobile = validatePhoneNumber(rawMobile);
    
    // Validation côté serveur
    if (rawPhone && !phone) {
      return { error: "Le numéro de téléphone fixe doit contenir 9 ou 10 chiffres (ex: 0212233445)" };
    }
    if (rawMobile && !mobile) {
      return { error: "Le numéro de mobile doit contenir 9 ou 10 chiffres (ex: 0555123456)" };
    }
    
    const rawData = {
      code: formData.get("code"),
      name: formData.get("name"),
      type: formData.get("type") || "individual",
      email: formData.get("email") || undefined,
      phone: phone,
      mobile: mobile,
      category: formData.get("category") || "regular",
      taxNumber: formData.get("taxNumber") || undefined,
      commercialRegistration: formData.get("commercialRegistration") || undefined,
      contactPerson: formData.get("contactPerson") || undefined,
      notes: formData.get("notes") || undefined,
      address: {
        street: formData.get("street") || undefined,
        city: formData.get("city") || undefined,
        state: formData.get("state") || undefined,
        country: "Algeria",
        postalCode: formData.get("postalCode") || undefined,
      },
      isActive: formData.get("isActive") === "true",
    };

    if (!rawData.code) {
      return { error: "Le code client est requis" };
    }
    if (!rawData.name) {
      return { error: "Le nom du client est requis" };
    }

    const payload = sanitizePayload(rawData);

    console.log("Création client - Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(`${API_URL}/clients`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Erreur API:", result);
      
      // Gestion spécifique des erreurs
      if (res.status === 400) {
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((err: any) => {
            if (err.field === 'phone') {
              return "Le numéro de téléphone fixe doit contenir 10 chiffres (ex: 0212233445)";
            }
            if (err.field === 'mobile') {
              return "Le numéro de mobile doit contenir 10 chiffres (ex: 0555123456)";
            }
            return `${err.field}: ${err.message}`;
          }).join(', ');
          return { error: errorMessages };
        }
        
        const errorMessage = result.message || "";
        if (errorMessage.includes("code")) return { error: "Ce code client est déjà utilisé" };
        if (errorMessage.includes("email")) return { error: "Cet email est déjà utilisé" };
        return { error: errorMessage || "Données invalides" };
      }
      
      if (res.status === 403) {
        if (result?.error_code === "SUBSCRIPTION_EXPIRED") {
          return { 
            error: "انتهت صلاحية الباقة، يرجى التجديد",
            subscriptionExpired: true,
            data: result.data
          };
        }
        return { error: "Accès non autorisé" };
      }
      
      if (res.status === 401) {
        return { 
          error: "Session expirée, veuillez vous reconnecter",
          redirectToLogin: true 
        };
      }
      
      return { error: result.message || "Erreur lors de la création" };
    }

    revalidatePath("/dashboard/clients");
    return { success: true, data: result.data };
    
  } catch (error: any) {
    console.error("Erreur réseau:", error);
    
    if (error.message === "Non authentifié") {
      return { 
        error: "Session expirée, veuillez vous reconnecter",
        redirectToLogin: true 
      };
    }
    
    return { error: "Impossible de contacter le serveur" };
  }
}

/**
 * Mettre à jour un client
 */
export async function updateClientAction(id: string, prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!id) {
      return { error: "ID client manquant" };
    }

    // Valider et formater les numéros de téléphone
    const rawPhone = formData.get("phone") as string | null;
    const rawMobile = formData.get("mobile") as string | null;
    
    const phone = validatePhoneNumber(rawPhone);
    const mobile = validatePhoneNumber(rawMobile);
    
    // Validation côté serveur
    if (rawPhone && !phone) {
      return { error: "Le numéro de téléphone fixe doit contenir 9 ou 10 chiffres (ex: 0212233445)" };
    }
    if (rawMobile && !mobile) {
      return { error: "Le numéro de mobile doit contenir 9 ou 10 chiffres (ex: 0555123456)" };
    }

    const rawData = {
      name: formData.get("name"),
      code: formData.get("code"),
      type: formData.get("type") || "individual",
      email: formData.get("email") || undefined,
      phone: phone,
      mobile: mobile,
      category: formData.get("category") || "regular",
      taxNumber: formData.get("taxNumber") || undefined,
      commercialRegistration: formData.get("commercialRegistration") || undefined,
      contactPerson: formData.get("contactPerson") || undefined,
      notes: formData.get("notes") || undefined,
      address: {
        street: formData.get("street") || undefined,
        city: formData.get("city") || undefined,
        state: formData.get("state") || undefined,
        country: "Algeria",
        postalCode: formData.get("postalCode") || undefined,
      },
      isActive: formData.get("isActive") === "true",
    };

    if (!rawData.name) {
      return { error: "Le nom du client est requis" };
    }
    if (!rawData.code) {
      return { error: "Le code client est requis" };
    }

    const payload = sanitizePayload(rawData);

    console.log("Mise à jour client - Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(`${API_URL}/clients/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Erreur API:", result);
      
      if (res.status === 400) {
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((err: any) => {
            if (err.field === 'phone') {
              return "Le numéro de téléphone fixe doit contenir 10 chiffres (ex: 0212233445)";
            }
            if (err.field === 'mobile') {
              return "Le numéro de mobile doit contenir 10 chiffres (ex: 0555123456)";
            }
            return `${err.field}: ${err.message}`;
          }).join(', ');
          return { error: errorMessages };
        }
        
        const errorMessage = result.message || "";
        if (errorMessage.includes("code")) return { error: "Ce code client est déjà utilisé" };
        if (errorMessage.includes("email")) return { error: "Cet email est déjà utilisé" };
        return { error: errorMessage || "Données invalides" };
      }
      
      if (res.status === 403) {
        if (result?.error_code === "SUBSCRIPTION_EXPIRED") {
          return { 
            error: "انتهت صلاحية الباقة، يرجى التجديد",
            subscriptionExpired: true,
            data: result.data
          };
        }
        return { error: "Accès non autorisé" };
      }
      
      if (res.status === 401) {
        return { 
          error: "Session expirée, veuillez vous reconnecter",
          redirectToLogin: true 
        };
      }
      
      if (res.status === 404) {
        return { error: "Client non trouvé" };
      }
      
      return { error: result.message || "Erreur lors de la mise à jour" };
    }

    revalidatePath(`/dashboard/clients/${id}`);
    revalidatePath(`/dashboard/clients/${id}/edit`);
    revalidatePath("/dashboard/clients");
    
    return { success: true, data: result.data };
    
  } catch (error: any) {
    console.error("Erreur réseau:", error);
    
    if (error.message === "Non authentifié") {
      return { 
        error: "Session expirée, veuillez vous reconnecter",
        redirectToLogin: true 
      };
    }
    
    return { error: "Erreur de connexion lors de la mise à jour" };
  }
}

/**
 * Supprimer un client
 */
export async function deleteClientAction(id: string): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!id) {
      return { success: false, error: "ID client manquant" };
    }

    const res = await fetch(`${API_URL}/clients/${id}`, {
      method: "DELETE",
      headers,
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        return { success: false, error: "Impossible de supprimer ce client car il a des factures associées" };
      }
      
      if (res.status === 403) {
        if (result?.error_code === "SUBSCRIPTION_EXPIRED") {
          return { 
            success: false,
            error: "انتهت صلاحية الباقة، يرجى التجديد",
            subscriptionExpired: true,
            data: result.data
          };
        }
        return { success: false, error: "Accès non autorisé" };
      }
      
      if (res.status === 401) {
        return { 
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
          redirectToLogin: true 
        };
      }
      
      if (res.status === 404) {
        return { success: false, error: "Client non trouvé" };
      }
      
      return { success: false, error: result.message || "Suppression impossible" };
    }

    revalidatePath("/dashboard/clients");
    return { success: true };
    
  } catch (error: any) {
    console.error("Erreur suppression client:", error);
    
    if (error.message === "Non authentifié") {
      return { 
        success: false,
        error: "Session expirée, veuillez vous reconnecter",
        redirectToLogin: true 
      };
    }
    
    return { success: false, error: "Erreur réseau lors de la suppression" };
  }
}

/**
 * Récupérer un client par ID
 */
export async function getClientByIdAction(id: string): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!id) {
      return { success: false, error: "ID client manquant" };
    }

    const res = await fetch(`${API_URL}/clients/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: "Client non trouvé" };
      }
      
      if (res.status === 403 && result?.error_code === "SUBSCRIPTION_EXPIRED") {
        return { 
          success: false,
          error: "انتهت صلاحية الباقة",
          subscriptionExpired: true,
          data: result.data
        };
      }
      
      if (res.status === 401) {
        return { 
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
          redirectToLogin: true 
        };
      }
      
      return { success: false, error: result.message || "Erreur lors de la récupération" };
    }

    return { success: true, data: result.data };
    
  } catch (error: any) {
    console.error("Erreur récupération client:", error);
    
    if (error.message === "Non authentifié") {
      return { 
        success: false,
        error: "Session expirée, veuillez vous reconnecter",
        redirectToLogin: true 
      };
    }
    
    return { success: false, error: "Erreur réseau" };
  }
}

/**
 * Vérifier la disponibilité d'un code client
 */
export async function checkClientCodeAction(code: string, clientId?: string): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!code) {
      return { success: false, error: "Code requis" };
    }

    const url = `/clients/check-code?code=${encodeURIComponent(code)}${clientId ? `&clientId=${clientId}` : ''}`;
    
    const res = await fetch(`${API_URL}${url}`, {
      method: "GET",
      headers,
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        return { 
          success: false,
          error: "Session expirée",
          redirectToLogin: true 
        };
      }
      return { success: false, error: result.message || "Erreur de vérification" };
    }

    return { success: true, data: result };
    
  } catch (error) {
    console.error("Erreur vérification code:", error);
    return { success: false, error: "Erreur réseau" };
  }
}

/**
 * Récupérer tous les clients avec pagination
 */
export async function getClientsAction(page: number = 1, limit: number = 10, search?: string): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    let url = `/clients?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const res = await fetch(`${API_URL}${url}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 403 && result?.error_code === "SUBSCRIPTION_EXPIRED") {
        return { 
          success: false,
          error: "انتهت صلاحية الباقة",
          subscriptionExpired: true,
          data: result.data
        };
      }
      
      if (res.status === 401) {
        return { 
          success: false,
          error: "Session expirée",
          redirectToLogin: true 
        };
      }
      
      return { success: false, error: result.message || "Erreur lors de la récupération" };
    }

    return { 
      success: true, 
      data: {
        clients: result.data || [],
        pagination: result.pagination || { total: 0, page, limit, pages: 1 }
      }
    };
    
  } catch (error: any) {
    console.error("Erreur récupération clients:", error);
    
    if (error.message === "Non authentifié") {
      return { 
        success: false,
        error: "Session expirée",
        redirectToLogin: true 
      };
    }
    
    return { success: false, error: "Erreur réseau" };
  }
}