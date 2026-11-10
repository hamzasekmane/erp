import { apiBaseUrl } from "@/app/lib/apiBase";
import { z } from "zod";

// ===== SCHÉMAS ZOD POUR L'IMPORTATION =====

// Schéma pour les statistiques d'import
export const ImportStatsSchema = z.object({
  total: z.number(),
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errors: z.number(),
  warnings: z.array(z.string()).optional(),
});

// Schéma pour les erreurs de validation
export const ImportErrorSchema = z.object({
  row: z.number(),
  field: z.string(),
  value: z.any(),
  message: z.string(),
});

// Schéma pour la réponse d'import
export const ImportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  stats: ImportStatsSchema,
  errors: z.array(ImportErrorSchema).optional(),
  data: z.array(z.any()).optional(),
});

// Schéma pour la validation pré-import
export const ImportValidationSchema = z.object({
  valid: z.boolean(),
  totalRows: z.number(),
  validRows: z.number(),
  invalidRows: z.number(),
  errors: z.array(ImportErrorSchema),
  preview: z.array(z.any()).optional(),
});

// Types inférés
export type ImportStats = z.infer<typeof ImportStatsSchema>;
export type ImportError = z.infer<typeof ImportErrorSchema>;
export type ImportResponse = z.infer<typeof ImportResponseSchema>;
export type ImportValidation = z.infer<typeof ImportValidationSchema>;

const API_URL = apiBaseUrl();

export const clientImportService = {
  /**
   * Importer des clients depuis un fichier
   */
  async importClients(file: File, options: ImportOptions, token: string): Promise<ImportResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("updateExisting", options.updateExisting ? "true" : "false");
      formData.append("skipDuplicates", options.skipDuplicates ? "true" : "false");
      formData.append("sendNotifications", options.sendNotifications ? "true" : "false");

      const url = `${API_URL}/clients/import`;
      console.log("📡 Appel API Import Clients:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("❌ Erreur API:", result);
        
        try {
          return ImportResponseSchema.parse({
            success: false,
            message: result.message || "Erreur lors de l'importation",
            stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 1 },
            errors: result.errors || [{ row: 0, field: "file", value: "", message: result.message }]
          });
        } catch {
          return {
            success: false,
            message: result.message || "Erreur lors de l'importation",
            stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 1 }
          };
        }
      }

      try {
        return ImportResponseSchema.parse(result);
      } catch (validationError) {
        console.error("❌ Erreur validation Zod:", validationError);
        return {
          success: result.success || false,
          message: result.message || "Importation terminée avec des avertissements",
          stats: result.stats || { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
          errors: result.errors || [],
          data: result.data || []
        };
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      return {
        success: false,
        message: "Impossible de contacter le serveur",
        stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 1 }
      };
    }
  },

  /**
   * Télécharger le modèle Excel
   */
  async downloadTemplate(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${API_URL}/clients/import/template`;
      console.log("📡 Appel API Download Template:", url);

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Erreur lors du téléchargement" }));
        throw new Error(error.message || "Erreur lors du téléchargement");
      }

      // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "modele_clients.xlsx";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur téléchargement modèle:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur lors du téléchargement" 
      };
    }
  },

  /**
   * Alias pour compatibilité (si du code appelle encore generateTemplate)
   * @deprecated Utilisez downloadTemplate à la place
   */
  async generateTemplate(token: string): Promise<{ success: boolean; error?: string }> {
    console.warn("⚠️ generateTemplate est déprécié, utilisez downloadTemplate");
    return this.downloadTemplate(token);
  },

  /**
   * Valider un fichier avant import
   */
  async validateFile(file: File, token: string): Promise<ImportValidation> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const url = `${API_URL}/clients/import/validate`;
      console.log("📡 Appel API Validate File:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          valid: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          errors: [{ row: 0, field: "file", value: "", message: result.message || "Fichier invalide" }]
        };
      }

      try {
        return ImportValidationSchema.parse(result);
      } catch (validationError) {
        console.error("❌ Erreur validation Zod:", validationError);
        return {
          valid: result.valid || false,
          totalRows: result.totalRows || 0,
          validRows: result.validRows || 0,
          invalidRows: result.invalidRows || 0,
          errors: result.errors || [],
          preview: result.preview || []
        };
      }
    } catch (error) {
      console.error("❌ Erreur validation:", error);
      return {
        valid: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [{ row: 0, field: "network", value: "", message: "Erreur de connexion" }]
      };
    }
  },

  /**
   * Obtenir l'historique des imports
   */
  async getImportHistory(token: string, page = 1, limit = 10): Promise<any> {
    try {
      const url = `${API_URL}/clients/import/history?page=${page}&limit=${limit}`;
      console.log("📡 Appel API Import History:", url);

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return { data: [], pagination: { total: 0, page: 1, limit, pages: 1 } };
      }

      return await res.json();
    } catch (error) {
      console.error("❌ Erreur récupération historique:", error);
      return { data: [], pagination: { total: 0, page: 1, limit, pages: 1 } };
    }
  },

  /**
   * Annuler un import en cours
   */
  async cancelImport(importId: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${API_URL}/clients/import/${importId}/cancel`;
      console.log("📡 Appel API Cancel Import:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Erreur lors de l'annulation");
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur annulation import:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur lors de l'annulation" 
      };
    }
  },
};

// Types pour les options d'import
export interface ImportOptions {
  updateExisting: boolean;
  skipDuplicates: boolean;
  sendNotifications: boolean;
}