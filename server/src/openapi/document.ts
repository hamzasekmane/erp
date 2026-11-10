import { OpenApiGeneratorV31, OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { createCheckoutSchema } from "../modules/payments/chargily/chargily.schema";
import { createClientSchema, updateClientSchema } from "../modules/clients/clients.dto";
import { createProductSchema, createCategorySchema, createTaxSchema } from "../modules/catalog/catalog.dto";
import { createInvoiceSchema, updateInvoiceSchema } from "../modules/invoices/invoices.dto";
import { createPaymentSchema, gatewaySchema, refundSchema } from "../modules/payments/payments.dto";
import {
  forgotPasswordSchema,
  loginSchema,
  mfaCodeSchema,
  mfaDisableSchema,
  mfaVerifySchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "../modules/auth/auth.dto";
import { changePasswordSchema, createUserSchema, updateUserSchema } from "../modules/users/users.dto";
import { changeSubscriptionSchema, updateSecuritySchema, updateSettingsSchema, updateTenantSchema } from "../modules/tenancy/tenancy.dto";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const bearer = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const errorSchema = z.object({
  success: z.literal(false),
  error_code: z.string(),
  message: z.string(),
  request_id: z.string().optional(),
});

const envelope = <T extends z.ZodTypeAny>(data: T) => z.object({ success: z.literal(true), data });

const pagination = z.object({ total: z.number(), page: z.number(), limit: z.number(), pages: z.number() });

function listResponse<T extends z.ZodTypeAny>(item: T) {
  return z.object({ success: z.literal(true), data: z.array(item), pagination });
}

function register(method: "get" | "post" | "put" | "patch" | "delete", path: string, tag: string, summary: string, options: {
  body?: z.ZodTypeAny;
  response?: z.ZodTypeAny;
  params?: z.ZodObject<z.ZodRawShape>;
  query?: z.ZodObject<z.ZodRawShape>;
  security?: boolean;
} = {}) {
  const security = options.security === false ? [] : [{ [bearer.name]: [] }];
  registry.registerPath({
    method,
    path,
    tags: [tag],
    summary,
    security,
    request: {
      ...(options.params ? { params: options.params as never } : {}),
      ...(options.query ? { query: options.query as never } : {}),
      ...(options.body ? { body: { content: { "application/json": { schema: options.body } } } } : {}),
    },
    responses: {
      200: {
        description: "Succès",
        content: { "application/json": { schema: options.response ?? envelope(z.unknown()) } },
      },
      400: { description: "Requête invalide", content: { "application/json": { schema: errorSchema } } },
      401: { description: "Non authentifié", content: { "application/json": { schema: errorSchema } } },
      403: { description: "Accès refusé", content: { "application/json": { schema: errorSchema } } },
      404: { description: "Introuvable", content: { "application/json": { schema: errorSchema } } },
    },
  });
}

const pageQuery = z.object({ page: z.coerce.number().optional(), limit: z.coerce.number().optional(), search: z.string().optional() });
const idParams = z.object({ id: z.string() });

/* auth */
register("post", "/auth/register", "Auth", "Créer un espace de travail", { body: registerSchema, security: false });
register("post", "/auth/login", "Auth", "Connexion (token + refreshToken)", { body: loginSchema, security: false });
register("post", "/auth/refresh", "Auth", "Rafraîchir la session", { body: refreshSchema, security: false });
register("post", "/auth/logout", "Auth", "Déconnexion");
register("get", "/auth/me", "Auth", "Profil, espace de travail et permissions");
register("post", "/auth/forgot-password", "Auth", "Demander un lien de réinitialisation", { body: forgotPasswordSchema, security: false });
register("post", "/auth/reset-password", "Auth", "Réinitialiser le mot de passe", { body: resetPasswordSchema, security: false });

/* tenant + subscriptions */
register("get", "/tenant", "Tenant", "Espace de travail courant");
register("put", "/tenant", "Tenant", "Mettre à jour l'espace de travail", { body: updateTenantSchema });
register("put", "/tenant/settings", "Tenant", "Mettre à jour les préférences", { body: updateSettingsSchema });
register("put", "/tenant/security", "Tenant", "Mettre à jour la sécurité", { body: updateSecuritySchema });
register("get", "/tenant/subscription", "Tenant", "Abonnement courant");
register("post", "/tenant/subscription", "Tenant", "Changer de formule", { body: changeSubscriptionSchema });
register("get", "/plans", "Tenant", "Formules disponibles", { security: false });
register("get", "/subscriptions/current", "Subscriptions", "Abonnement courant (format UI)");
register("get", "/subscriptions/plans", "Subscriptions", "Formules (format UI)");
register("get", "/subscriptions/invoices", "Subscriptions", "Factures d'abonnement");
register("put", "/subscriptions/upgrade", "Subscriptions", "Passer à une formule supérieure");
register("put", "/subscriptions/downgrade", "Subscriptions", "Rétrograder de formule");
register("post", "/subscriptions/cancel", "Subscriptions", "Résilier l'abonnement");
register("get", "/subscriptions/limits", "Subscriptions", "Utilisation courante");

/* users */
register("get", "/users", "Users", "Lister les utilisateurs", { query: pageQuery, response: listResponse(z.unknown()) });
register("post", "/users", "Users", "Créer un utilisateur", { body: createUserSchema });
register("put", "/users/:id", "Users", "Modifier un utilisateur", { body: updateUserSchema, params: idParams });
register("delete", "/users/:id", "Users", "Supprimer un utilisateur", { params: idParams });
register("get", "/users/profile/me", "Users", "Profil courant");
register("put", "/users/change-password", "Users", "Changer son mot de passe", { body: changePasswordSchema });
register("get", "/users/roles", "Users", "Rôles et permissions");

/* clients */
register("get", "/clients", "Clients", "Lister les clients", { query: pageQuery, response: listResponse(z.unknown()) });
register("post", "/clients", "Clients", "Créer un client", { body: createClientSchema });
register("get", "/clients/check-code", "Clients", "Vérifier la disponibilité d'un code");
register("get", "/clients/check-email", "Clients", "Vérifier la disponibilité d'un email");
register("get", "/clients/:id", "Clients", "Détail d'un client", { params: idParams });
register("get", "/clients/:id/stats", "Clients", "Statistiques d'un client", { params: idParams });
register("get", "/clients/:id/invoices", "Clients", "Factures d'un client", { params: idParams });
register("put", "/clients/:id", "Clients", "Modifier un client", { body: updateClientSchema, params: idParams });
register("delete", "/clients/:id", "Clients", "Supprimer un client", { params: idParams });
register("get", "/client-groups", "Clients", "Groupes de clients");
register("post", "/client-groups", "Clients", "Créer un groupe");
register("get", "/client-notes", "Clients", "Notes clients");

/* catalog */
register("get", "/products", "Catalog", "Lister les produits", { query: pageQuery, response: listResponse(z.unknown()) });
register("get", "/products/stats", "Catalog", "Statistiques produits");
register("post", "/products", "Catalog", "Créer un produit", { body: createProductSchema });
register("put", "/products/:id", "Catalog", "Modifier un produit", { params: idParams });
register("patch", "/products/:id/status", "Catalog", "Activer/désactiver un produit", { params: idParams });
register("delete", "/products/:id", "Catalog", "Supprimer un produit", { params: idParams });
register("post", "/products/:id/stock", "Catalog", "Mouvement de stock", { params: idParams });
register("get", "/categories", "Catalog", "Lister les catégories");
register("post", "/categories", "Catalog", "Créer une catégorie", { body: createCategorySchema });
register("get", "/taxes", "Catalog", "Lister les taxes");
register("post", "/taxes", "Catalog", "Créer une taxe", { body: createTaxSchema });

/* invoices */
register("get", "/invoices", "Invoices", "Lister les factures", { query: pageQuery, response: listResponse(z.unknown()) });
register("get", "/invoices/stats", "Invoices", "Statistiques de facturation");
register("get", "/invoices/overdue", "Invoices", "Factures en retard");
register("get", "/invoices/client/:clientId", "Invoices", "Factures d'un client");
register("post", "/invoices", "Invoices", "Créer une facture", { body: createInvoiceSchema });
register("get", "/invoices/:id", "Invoices", "Détail d'une facture", { params: idParams });
register("put", "/invoices/:id", "Invoices", "Modifier une facture", { body: updateInvoiceSchema, params: idParams });
register("patch", "/invoices/:id/status", "Invoices", "Changer le statut", { params: idParams });
register("post", "/invoices/:id/duplicate", "Invoices", "Dupliquer une facture", { params: idParams });
register("post", "/invoices/:id/send", "Invoices", "Envoyer une facture", { params: idParams });
register("post", "/invoices/:id/pay", "Invoices", "Encaisser un paiement", { params: idParams });
register("get", "/invoices/:id/pdf", "Invoices", "PDF de la facture", { params: idParams });
register("get", "/invoices/:id/view", "Invoices", "Vue publique", { params: idParams, security: false });
register("delete", "/invoices/:id", "Invoices", "Supprimer une facture", { params: idParams });

/* payments */
/* auth: MFA (TOTP) */
register("post", "/auth/mfa/verify", "Auth", "Valider le code MFA et obtenir une session", { body: mfaVerifySchema, security: false });
register("get", "/auth/mfa", "Auth", "Statut MFA de l'utilisateur courant");
register("post", "/auth/mfa/setup", "Auth", "Générer un secret TOTP (non activé)");
register("post", "/auth/mfa/enable", "Auth", "Confirmer et activer la MFA", { body: mfaCodeSchema });
register("post", "/auth/mfa/disable", "Auth", "Désactiver la MFA (mot de passe + code)", { body: mfaDisableSchema });

register("get", "/payments", "Payments", "Lister les paiements", { query: pageQuery, response: listResponse(z.unknown()) });
register("get", "/payments/stats", "Payments", "Statistiques de paiement");
register("post", "/payments", "Payments", "Enregistrer un paiement", { body: createPaymentSchema });
register("post", "/payments/:id/refund", "Payments", "Rembourser", { body: refundSchema, params: idParams });
register("patch", "/payments/:id/reconcile", "Payments", "Rapprocher", { params: idParams });
register("get", "/payments/settings/gateways", "Payments", "Passerelles de paiement");
register("get", "/payments/settings/methods", "Payments", "Moyens de paiement");
register("post", "/payments/settings/gateways/setup", "Payments", "Configurer une passerelle (secret chiffré)", { body: gatewaySchema });

/* chargily pay v2 (CIB / EDAHABIA) */
register("get", "/payments/chargily/status", "Chargily", "État de la configuration Chargily");
register("post", "/payments/chargily/checkouts", "Chargily", "Créer un checkout pour une facture", { body: createCheckoutSchema });
register("get", "/payments/chargily/checkouts", "Chargily", "Historique des checkouts");
register("post", "/payments/chargily/checkouts/:id/refresh", "Chargily", "Revérifier un checkout auprès de Chargily", { params: idParams });
register("post", "/payments/chargily/invoices/:invoiceId/refresh", "Chargily", "Revérifier les checkouts d'une facture");
register("post", "/payments/chargily/webhook", "Chargily", "Webhook signé Chargily (HMAC-SHA256)", { security: false });

/* dashboard + reports */
register("get", "/dashboard/stats", "Dashboard", "Statistiques du tableau de bord");
register("get", "/dashboard/quick-stats", "Dashboard", "Indicateurs rapides");
register("get", "/dashboard/notifications", "Notifications", "Notifications");
register("get", "/dashboard/notifications/unread/count", "Notifications", "Compteur non lus");
register("put", "/dashboard/notifications/read-all", "Notifications", "Tout marquer comme lu");
register("get", "/reports/sales", "Reports", "Rapport des ventes");
register("get", "/reports/payments", "Reports", "Rapport des paiements");
register("get", "/reports/clients", "Reports", "Rapport clients");
register("get", "/reports/products", "Reports", "Rapport produits");
register("get", "/reports/aging", "Reports", "Balance âgée");
register("get", "/reports/export", "Reports", "Export CSV");

/* hr / support / archives / api keys / admin */
register("get", "/hr/employees", "HR", "Lister les employés", { query: pageQuery, response: listResponse(z.unknown()) });
register("post", "/hr/employees", "HR", "Créer un employé");
register("get", "/hr/departments", "HR", "Lister les départements");
register("get", "/hr/leaves", "HR", "Lister les congés");
register("post", "/hr/leaves", "HR", "Demander un congé");
register("get", "/hr/attendance", "HR", "Pointage");
register("post", "/hr/attendance", "HR", "Enregistrer un pointage");
register("get", "/hr/payroll", "HR", "Paie du mois");
register("get", "/support/tickets", "Support", "Lister les tickets");
register("post", "/support/tickets", "Support", "Ouvrir un ticket");
register("get", "/archives/documents", "Archives", "Lister les documents");
register("post", "/archives/documents", "Archives", "Archiver un document");
register("get", "/api-keys", "API Keys", "Lister les clés API");
register("post", "/api-keys", "API Keys", "Créer une clé API");
register("delete", "/api-keys/:id", "API Keys", "Révoquer une clé API", { params: idParams });
register("get", "/admin/tenants", "Admin", "Lister les espaces de travail", { query: pageQuery, response: listResponse(z.unknown()) });
register("post", "/admin/tenants", "Admin", "Créer un espace de travail");
register("get", "/admin/metrics", "Admin", "Métriques plateforme");
register("get", "/uploads", "Fichiers", "Lister les fichiers du tenant", { query: pageQuery, response: listResponse(z.unknown()) });
register("post", "/uploads", "Fichiers", "Téléverser un fichier (multipart/form-data, champ `file`)");
register("post", "/uploads/logo", "Fichiers", "Définir le logo du tenant (multipart/form-data)");
register("get", "/uploads/:id", "Fichiers", "Télécharger un fichier", { params: idParams });
register("delete", "/uploads/:id", "Fichiers", "Supprimer un fichier", { params: idParams });
register("get", "/clients/import/template", "Import clients", "Modèle CSV d'import");
register("post", "/clients/import/validate", "Import clients", "Valider un fichier CSV (multipart/form-data)");
register("post", "/clients/import", "Import clients", "Importer des clients depuis un CSV (multipart/form-data)");
register("get", "/clients/import/history", "Import clients", "Historique des imports", { query: pageQuery });
register("get", "/admin/outbox/stats", "Exploitation", "Statistiques de la file d'événements");
register("post", "/admin/outbox/process", "Exploitation", "Traiter la file d'événements (e-mails)");
register("post", "/admin/maintenance/run", "Exploitation", "Lancer les tâches de maintenance");
register("get", "/admin/maintenance/status", "Exploitation", "Dernière exécution de maintenance");
register("post", "/internal/maintenance/run", "Exploitation", "Point d'entrée cron (en-tête x-maintenance-token)", { security: false });

export function buildOpenApiDocument(baseUrl = "http://localhost:4000") {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "ERP API",
      version: "1.0.0",
      description:
        "API REST du ERP (NestJS + PostgreSQL). Contrat consommé par le frontend Next.js. Enveloppe succès `{ success, data }`, erreurs `{ success:false, error_code, message }`.",
    },
    servers: [
      { url: `${baseUrl}/api/v1`, description: "Versionné" },
      { url: `${baseUrl}/api`, description: "Alias frontend" },
    ],
  });
}
