"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiKeysState } from "../types/apiKeysTypes";

// ========================
// ✅ VALIDATION SCHEMAS
// ========================
const createApiKeySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  permissions: z.array(z.string()).min(1, "Au moins une permission est requise"),
  scopes: z.array(z.string()).min(1, "Au moins un scope est requis"),
  expiresInDays: z.coerce.number().min(0, "Les jours doivent être positifs"),
  rateLimit: z.coerce.number().min(100, "Le rate limit minimum est 100"),
  ipWhitelist: z.string().optional()
});

const updateApiKeySchema = z.object({
  isActive: z.boolean().optional(),
  rateLimit: z.coerce.number().min(100).optional()
});

// ========================
// ✅ HELPERS
// ========================
async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ========================
// ✅ FETCH API KEYS
// ========================
export async function fetchApiKeysAction(): Promise<ApiKeysState> {
  try {
    const token = await getToken();

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié", 
        data: { keys: [] } 
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result.message || "Erreur lors du chargement des clés API",
        data: { keys: [] }
      };
    }

    return {
      success: true,
      message: "Clés API chargées avec succès",
      data: { keys: result.data || [] }
    };
  } catch (err: any) {
    console.error("Fetch API Keys Error:", err);
    return {
      success: false,
      message: err.message || "Erreur réseau lors du chargement",
      data: { keys: [] }
    };
  }
}

// ========================
// ✅ CREATE API KEY
// ========================
export async function createApiKeyAction(
  prevState: ApiKeysState,
  formData: FormData
): Promise<ApiKeysState> {
  try {
    const token = await getToken();

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié. Veuillez vous reconnecter." 
      };
    }

    const rawData = {
      name: formData.get("name"),
      permissions: formData.getAll("permissions"),
      scopes: formData.getAll("scopes"),
      expiresInDays: formData.get("expiresInDays"),
      rateLimit: formData.get("rateLimit"),
      ipWhitelist: formData.get("ipWhitelist") || undefined
    };

    const validated = createApiKeySchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        message: "Erreur de validation",
        errors: validated.error.flatten().fieldErrors
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validated.data)
    });

    const result = await res.json();

    if (!res.ok) {
      return { 
        success: false, 
        message: result.message || "Erreur lors de la création de la clé API" 
      };
    }

    revalidatePath("/dashboard/settings/api");

    return {
      success: true,
      message: "Clé API créée avec succès",
      data: {
        keys: prevState.data?.keys || [],
        newKey: result.data?.key || result.data?.apiKey
      }
    };
  } catch (err: any) {
    console.error("Create API Key Error:", err);
    return { 
      success: false, 
      message: err.message || "Erreur réseau lors de la création" 
    };
  }
}

// ========================
// ✅ DELETE API KEY
// ========================
export async function deleteApiKeyAction(
  prevState: ApiKeysState,
  formData: FormData
): Promise<ApiKeysState> {
  try {
    const token = await getToken();
    const keyId = formData.get("keyId") as string;

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié. Veuillez vous reconnecter." 
      };
    }

    if (!keyId) {
      return { 
        success: false, 
        message: "ID de clé API manquant" 
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      method: "DELETE",
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    if (!res.ok) {
      const result = await res.json();
      return { 
        success: false, 
        message: result.message || "Erreur lors de la suppression" 
      };
    }

    revalidatePath("/dashboard/settings/api");

    return {
      success: true,
      message: "Clé API supprimée avec succès",
      data: { keys: prevState.data?.keys || [] }
    };
  } catch (err: any) {
    console.error("Delete API Key Error:", err);
    return { 
      success: false, 
      message: err.message || "Erreur réseau lors de la suppression" 
    };
  }
}

// ========================
// ✅ REGENERATE API KEY
// ========================
export async function regenerateApiKeyAction(
  prevState: ApiKeysState,
  formData: FormData
): Promise<ApiKeysState> {
  try {
    const token = await getToken();
    const keyId = formData.get("keyId") as string;

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié. Veuillez vous reconnecter." 
      };
    }

    if (!keyId) {
      return { 
        success: false, 
        message: "ID de clé API manquant" 
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys/${keyId}/regenerate`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const result = await res.json();

    if (!res.ok) {
      return { 
        success: false, 
        message: result.message || "Erreur lors de la régénération" 
      };
    }

    revalidatePath("/dashboard/settings/api");

    return {
      success: true,
      message: "Clé API régénérée avec succès",
      data: {
        keys: prevState.data?.keys || [],
        newKey: result.data?.key || result.data?.apiKey
      }
    };
  } catch (err: any) {
    console.error("Regenerate API Key Error:", err);
    return { 
      success: false, 
      message: err.message || "Erreur réseau lors de la régénération" 
    };
  }
}

// ========================
// ✅ UPDATE API KEY
// ========================
export async function updateApiKeyAction(
  prevState: ApiKeysState,
  formData: FormData
): Promise<ApiKeysState> {
  try {
    const token = await getToken();
    const keyId = formData.get("keyId") as string;

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié. Veuillez vous reconnecter." 
      };
    }

    if (!keyId) {
      return { 
        success: false, 
        message: "ID de clé API manquant" 
      };
    }

    const payload: any = {};

    if (formData.has("isActive")) {
      payload.isActive = formData.get("isActive") === "true";
    }

    if (formData.has("rateLimit")) {
      const rateLimit = Number(formData.get("rateLimit"));
      if (!isNaN(rateLimit) && rateLimit >= 100) {
        payload.rateLimit = rateLimit;
      }
    }

    const validated = updateApiKeySchema.safeParse(payload);

    if (!validated.success) {
      return {
        success: false,
        message: "Erreur de validation",
        errors: validated.error.flatten().fieldErrors
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const result = await res.json();
      return { 
        success: false, 
        message: result.message || "Erreur lors de la mise à jour" 
      };
    }

    revalidatePath("/dashboard/settings/api");
    revalidatePath(`/dashboard/settings/api/${keyId}`);

    return {
      success: true,
      message: "Clé API mise à jour avec succès",
      data: { keys: prevState.data?.keys || [] }
    };
  } catch (err: any) {
    console.error("Update API Key Error:", err);
    return { 
      success: false, 
      message: err.message || "Erreur réseau lors de la mise à jour" 
    };
  }
}

// ========================
// ✅ GET SINGLE API KEY
// ========================
export async function getApiKeyAction(keyId: string): Promise<ApiKeysState> {
  try {
    const token = await getToken();

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié. Veuillez vous reconnecter." 
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result.message || "Erreur lors du chargement de la clé API"
      };
    }

    return {
      success: true,
      message: "Clé API chargée avec succès",
      data: { keys: [result.data] }
    };
  } catch (err: any) {
    console.error("Get API Key Error:", err);
    return {
      success: false,
      message: err.message || "Erreur réseau lors du chargement"
    };
  }
}

// ========================
// ✅ GET API KEY STATS
// ========================
export async function getApiKeyStatsAction(): Promise<{
  success: boolean;
  message: string;
  data?: {
    total: number;
    active: number;
    inactive: number;
    totalRequests: number;
    averageRateLimit: number;
  };
}> {
  try {
    const token = await getToken();

    if (!token) {
      return { 
        success: false, 
        message: "Non authentifié" 
      };
    }

    const res = await fetch(`${API_BASE_URL}/api-keys/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result.message || "Erreur lors du chargement des statistiques"
      };
    }

    return {
      success: true,
      message: "Statistiques chargées avec succès",
      data: result.data
    };
  } catch (err: any) {
    console.error("Get API Key Stats Error:", err);
    return {
      success: false,
      message: err.message || "Erreur réseau lors du chargement des statistiques"
    };
  }
}