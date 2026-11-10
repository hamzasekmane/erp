import { apiBaseUrl } from "@/app/lib/apiBase";
import { ApiResponse } from "./settingsService";

const API_BASE_URL = apiBaseUrl();

export const apiService = {
  register: async (data: any) => {
    console.log("📤 Envoi du payload au backend:", JSON.stringify(data, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("📡 Statut de la réponse:", response.status);
    console.log("📡 Headers de réponse:", Object.fromEntries(response.headers.entries()));
    
    return response;
  },
  
  login: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response;
  },
  requestReset: async (email: string): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erreur lors de l'envoi");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
};