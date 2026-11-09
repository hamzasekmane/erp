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

  const selectedPlan = formData.get("planCode") as string || "free";

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
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    };

    cookieStore.set("token", responseData.token, cookieOptions);
    if (responseData.user) {
      cookieStore.set("user", JSON.stringify(responseData.user), { ...cookieOptions, httpOnly: false });
    }
    if (responseData.tenant) {
      cookieStore.set("tenant", JSON.stringify(responseData.tenant), { ...cookieOptions, httpOnly: false });
    }

    return {
      success: true,
      message: "Inscription réussie !",
      user: responseData.user,
      tenant: responseData.tenant
    };

  } catch (error: any) {
    console.error("❌ Erreur critique:", error);
    return {
      success: false,
      errors: {},
      message: error.message || "Erreur de connexion au serveur.",
      backendErrors: []
    };
  }
}