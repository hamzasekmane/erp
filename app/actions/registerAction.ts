"use server";
import { registerSchema } from "@/app/lib/zod-schemas";
import { apiService } from "@/app/services/api";
import { cookies } from "next/headers";

export async function registerAction(_prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  // Validation Zod
  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: "Veuillez corriger les erreurs dans le formulaire.",
      backendErrors: []
    };
  }

  const rawPlan = (formData.get("planCode") as string) || "trial";
  const planMap: Record<string, string> = {
    free: "trial",
    essai: "trial",
    starter: "starter",
    pro: "professional",
    professional: "professional",
    scale: "professional",
    growth: "enterprise",
    enterprise: "enterprise",
  };
  const selectedPlan = planMap[rawPlan.toLowerCase()] || rawPlan;

  // Construction du payload avec valeurs par défaut (déjà dans le schéma)
  const payload = {
    tenantData: {
      name: validated.data.businessName,
      businessName: validated.data.businessName,
      taxNumber: validated.data.taxNumber,
      // Génération d’un domaine unique si ton backend l’exige (optionnel)
      domain: validated.data.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .substring(0, 30),
      contact: {
        email: validated.data.email,
        phone: validated.data.phone || ""
      },
      address: {
        street: validated.data.street,
        city: validated.data.city,
        postalCode: validated.data.postalCode,
        country: validated.data.country
      },
      currency: "DZD",
      language: "fr"
    },
    userData: {
      name: validated.data.name,
      email: validated.data.email,
      password: validated.data.password,
      phone: validated.data.phone || "",
      role: "admin"
    },
    planCode: selectedPlan
  };

  console.log("📤 Envoi du payload au backend:", JSON.stringify(payload, null, 2));

  try {
    const response = await apiService.register(payload);
    const responseData = await response.json();
    console.log("📡 Statut:", response.status);
    console.log("📨 Réponse backend:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      let errorMessage = responseData.message || "L'inscription a échoué.";
      let fieldErrors: Record<string, string[]> = {};

      // Gestion structurée des erreurs
      if (responseData.errors) {
        if (Array.isArray(responseData.errors)) {
          responseData.errors.forEach((err: any) => {
            const field = err.path || err.field;
            if (field) fieldErrors[field] = [err.message];
          });
        } else if (typeof responseData.errors === 'object') {
          fieldErrors = responseData.errors;
        }
      }

      // Cas particulier du code postal
      if (responseData.error?.includes("postalCode")) {
        fieldErrors.postalCode = ["Le code postal doit être composé de 5 chiffres"];
        errorMessage = "Code postal invalide.";
      }

      return {
        success: false,
        errors: fieldErrors,
        message: errorMessage,
        backendErrors: responseData.errors || []
      };
    }

    // Succès – stockage des cookies
    // One place decides cookie lifetimes (see app/lib/session.ts): the access
    // token's cookie must expire with the token, and the refresh token has to be
    // kept or the session dies silently after an hour.
    const { storeSession } = await import("@/app/lib/session");
    await storeSession(responseData);

    return {
      success: true,
      message: "Inscription réussie !",
      user: responseData.user,
      tenant: responseData.tenant
    };

  } catch (error: any) {
    console.error("❌ Erreur critique:", error);
    const isConnRefused =
      error?.cause?.code === "ECONNREFUSED" ||
      error?.cause?.errors?.some?.((e: any) => e.code === "ECONNREFUSED") ||
      error?.message === "fetch failed";

    const message = isConnRefused
      ? "Impossible de contacter le serveur backend (port 4000). Veuillez vous assurer que l'API est démarrée."
      : error.message || "Erreur de connexion au serveur.";

    return {
      success: false,
      errors: {},
      message,
      backendErrors: []
    };
  }
}