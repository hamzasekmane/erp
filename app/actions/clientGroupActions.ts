"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_URL = apiBaseUrl();

/* ========================= */
/* TYPES */
/* ========================= */

type ActionResponse<T = any> = {
  success?: boolean;
  error?: string;
  data?: T;
};

/* ========================= */
/* AUTH HEADERS */
/* ========================= */

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/* ========================= */
/* SANITIZE PAYLOAD */
/* ========================= */

function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    return obj
      .map((item) => sanitizePayload(item))
      .filter((item) => item !== undefined);
  }

  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, sanitizePayload(v)])
        .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
    );
  }

  return obj;
}

/* ========================= */
/* CREATE GROUP */
/* ========================= */

export async function createClientGroupAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      color: formData.get("color") || "from-cyan-500 to-blue-600",
      discount: Number(formData.get("discount")) || 0,
      groupedBilling: formData.get("groupedBilling") === "true",
    };

    if (!rawData.name) {
      return { error: "Le nom du groupe est requis" };
    }

    const payload = sanitizePayload(rawData);

    const res = await fetch(`${API_URL}/client-groups`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 400) {
        if (result.errors?.length) {
          const msg = result.errors
            .map((e: any) => `${e.field || "Champ"}: ${e.message}`)
            .join(", ");

          return { error: msg };
        }

        if (result.message?.includes("name")) {
          return { error: "Ce nom de groupe est déjà utilisé" };
        }
      }

      return { error: result.message || "Erreur lors de la création" };
    }

    revalidatePath("/dashboard/clients/groups");

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Create group error:", error);
    return { error: "Impossible de contacter le serveur" };
  }
}

/* ========================= */
/* UPDATE GROUP */
/* ========================= */

export async function updateClientGroupAction(
  id: string,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!id) {
      return { error: "ID du groupe manquant" };
    }

    const rawData = {
      name: formData.get("name") || undefined,
      description: formData.get("description") || undefined,
      color: formData.get("color") || undefined,
      discount: formData.get("discount")
        ? Number(formData.get("discount"))
        : undefined,
      groupedBilling:
        formData.get("groupedBilling") === "true"
          ? true
          : formData.get("groupedBilling") === "false"
          ? false
          : undefined,
    };

    const payload = sanitizePayload(rawData);

    const res = await fetch(`${API_URL}/client-groups/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 400 && result.message?.includes("name")) {
        return { error: "Ce nom de groupe est déjà utilisé" };
      }

      return { error: result.message || "Erreur lors de la mise à jour" };
    }

    revalidatePath(`/dashboard/clients/groups/${id}`);
    revalidatePath("/dashboard/clients/groups");

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Update group error:", error);
    return { error: "Erreur réseau lors de la mise à jour" };
  }
}

/* ========================= */
/* DELETE GROUP */
/* ========================= */

export async function deleteClientGroupAction(
  id: string
): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!id) {
      return { error: "ID du groupe manquant" };
    }

    const res = await fetch(`${API_URL}/client-groups/${id}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        return {
          error:
            "Impossible de supprimer ce groupe car il contient des clients",
        };
      }

      return { error: result.message || "Suppression impossible" };
    }

    revalidatePath("/dashboard/clients/groups");

    return { success: true };
  } catch (error) {
    console.error("Delete group error:", error);
    return { error: "Erreur réseau lors de la suppression" };
  }
}

/* ========================= */
/* ADD CLIENTS */
/* ========================= */

export async function addClientsToGroupAction(
  groupId: string,
  clientIds: string[]
): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!groupId) return { error: "ID du groupe manquant" };
    if (!clientIds?.length) return { error: "Aucun client sélectionné" };

    const res = await fetch(`${API_URL}/client-groups/${groupId}/clients`, {
      method: "POST",
      headers,
      body: JSON.stringify({ clientIds }),
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.message || "Erreur lors de l'ajout" };
    }

    revalidatePath(`/dashboard/clients/groups/${groupId}`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Add clients error:", error);
    return { error: "Erreur réseau lors de l'ajout" };
  }
}

/* ========================= */
/* REMOVE CLIENTS */
/* ========================= */

export async function removeClientsFromGroupAction(
  groupId: string,
  clientIds: string[]
): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();

    if (!groupId) return { error: "ID du groupe manquant" };
    if (!clientIds?.length) return { error: "Aucun client sélectionné" };

    const res = await fetch(`${API_URL}/client-groups/${groupId}/clients`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ clientIds }),
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.message || "Erreur lors du retrait" };
    }

    revalidatePath(`/dashboard/clients/groups/${groupId}`);

    return { success: true };
  } catch (error) {
    console.error("Remove clients error:", error);
    return { error: "Erreur réseau lors du retrait" };
  }
}