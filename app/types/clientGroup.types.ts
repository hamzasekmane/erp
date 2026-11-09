import { z } from "zod";

// ===== SCHÉMAS ZOD POUR LES GROUPES =====

/**
 * Schéma principal pour un groupe de clients
 */
export const ClientGroupSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Le nom du groupe est requis"),
  description: z.string().optional().nullable(),
  color: z.string().optional().default("from-cyan-500 to-blue-600"),
  clientCount: z.number().default(0),
  totalBalance: z.number().default(0),
  discount: z.number().min(0).max(100).default(0),
  groupedBilling: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(),
  createdBy: z.string().optional(),
  clients: z.array(z.string()).optional(),
});

/**
 * Schéma pour la création d'un groupe
 */
export const CreateClientGroupSchema = ClientGroupSchema.omit({ 
  _id: true, 
  clientCount: true, 
  totalBalance: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true
}).partial({ 
  clients: true,
  description: true,
  color: true
});

/**
 * Schéma pour la mise à jour d'un groupe
 */
export const UpdateClientGroupSchema = CreateClientGroupSchema.partial();

/**
 * Schéma pour la réponse API (liste de groupes)
 */
export const ClientGroupsResponseSchema = z.object({
  data: z.array(ClientGroupSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }).optional(),
});

/**
 * Schéma pour la réponse d'un groupe unique
 */
export const ClientGroupResponseSchema = z.object({
  data: ClientGroupSchema,
});

/**
 * Schéma pour les statistiques des groupes
 */
export const ClientGroupStatsSchema = z.object({
  totalGroups: z.number(),
  totalClients: z.number(),
  totalBalance: z.number(),
  averageClientsPerGroup: z.number(),
  largestGroup: z.object({
    name: z.string(),
    clientCount: z.number(),
  }).optional(),
});

// ===== TYPES INFÉRÉS =====

/**
 * Type pour un groupe de clients
 */
export type ClientGroup = z.infer<typeof ClientGroupSchema>;

/**
 * Type pour la création d'un groupe
 */
export type CreateClientGroup = z.infer<typeof CreateClientGroupSchema>;

/**
 * Type pour la mise à jour d'un groupe
 */
export type UpdateClientGroup = z.infer<typeof UpdateClientGroupSchema>;

/**
 * Type pour les statistiques des groupes
 */
export type ClientGroupStats = z.infer<typeof ClientGroupStatsSchema>;

/**
 * Type pour la réponse API (liste)
 */
export type ClientGroupsResponse = z.infer<typeof ClientGroupsResponseSchema>;

/**
 * Type pour la réponse API (groupe unique)
 */
export type ClientGroupResponse = z.infer<typeof ClientGroupResponseSchema>;

// ===== TYPES POUR LES CLIENTS DANS UN GROUPE =====

/**
 * Type pour un client (version simplifiée pour les listes)
 */
export interface GroupClient {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  balance?: number;
  type?: 'individual' | 'company';
  code?: string;
}

/**
 * Type pour la réponse API des clients d'un groupe
 */
export interface GroupClientsResponse {
  data: GroupClient[];
}

// ===== TYPES POUR LES PARAMÈTRES DE RECHERCHE =====

/**
 * Type pour les paramètres de requête
 */
export interface GroupQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ===== TYPES POUR LES FORMULAIRES =====

/**
 * Type pour le formulaire de groupe (création/édition)
 */
export interface GroupFormData {
  name: string;
  description: string;
  color: string;
  discount: number;
  groupedBilling: boolean;
}

// ===== ÉNUMÉRATIONS =====

/**
 * Options de couleur disponibles pour les groupes
 */
export const COLOR_OPTIONS = [
  { value: "from-cyan-500 to-blue-600", label: "Cyan → Bleu", bg: "bg-gradient-to-r from-cyan-500 to-blue-600" },
  { value: "from-emerald-500 to-teal-600", label: "Émeraude → Teal", bg: "bg-gradient-to-r from-emerald-500 to-teal-600" },
  { value: "from-violet-500 to-purple-600", label: "Violet → Pourpre", bg: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { value: "from-amber-500 to-orange-600", label: "Ambre → Orange", bg: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { value: "from-rose-500 to-pink-600", label: "Rose → Rose foncé", bg: "bg-gradient-to-r from-rose-500 to-pink-600" },
  { value: "from-indigo-500 to-blue-600", label: "Indigo → Bleu", bg: "bg-gradient-to-r from-indigo-500 to-blue-600" },
] as const;

/**
 * Type pour les options de couleur
 */
export type ColorOption = typeof COLOR_OPTIONS[number];

// ===== FONCTIONS UTILITAIRES =====

/**
 * Valide si un objet est un groupe valide
 */
export function isValidClientGroup(obj: any): obj is ClientGroup {
  try {
    ClientGroupSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formate un groupe pour l'affichage
 */
export function formatGroupForDisplay(group: ClientGroup) {
  return {
    ...group,
    displayId: group._id.slice(-8).toUpperCase(),
    displayDate: new Date(group.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    displayBalance: group.totalBalance.toLocaleString(),
    hasClients: group.clientCount > 0,
  };
}

/**
 * Calcule les statistiques avancées d'un groupe
 */
export function calculateGroupStats(group: ClientGroup, clients: GroupClient[]) {
  const totalBalance = clients.reduce((sum, client) => sum + (client.balance || 0), 0);
  const averageBalance = clients.length > 0 ? totalBalance / clients.length : 0;
  const companiesCount = clients.filter(c => c.type === 'company').length;
  const individualsCount = clients.filter(c => c.type !== 'company').length;

  return {
    ...group,
    totalBalance,
    averageBalance,
    companiesCount,
    individualsCount,
    clientCount: clients.length,
    hasClients: clients.length > 0,
  };
}

// ===== CONSTANTES =====

/**
 * Valeurs par défaut pour un nouveau groupe
 */
export const DEFAULT_GROUP_VALUES: CreateClientGroup = {
  name: "",
  description: "",
  color: "from-cyan-500 to-blue-600",
  discount: 0,
  groupedBilling: false,
};

/**
 * Messages d'erreur standardisés
 */
export const GROUP_ERROR_MESSAGES = {
  NOT_FOUND: "Groupe non trouvé",
  NAME_REQUIRED: "Le nom du groupe est requis",
  NAME_EXISTS: "Ce nom de groupe est déjà utilisé",
  DISCOUNT_INVALID: "La remise doit être comprise entre 0 et 100%",
  HAS_CLIENTS: "Impossible de supprimer un groupe qui contient des clients",
  CREATION_FAILED: "Erreur lors de la création du groupe",
  UPDATE_FAILED: "Erreur lors de la mise à jour du groupe",
  DELETE_FAILED: "Erreur lors de la suppression du groupe",
} as const;

/**
 * Messages de succès standardisés
 */
export const GROUP_SUCCESS_MESSAGES = {
  CREATED: "Groupe créé avec succès",
  UPDATED: "Groupe modifié avec succès",
  DELETED: "Groupe supprimé avec succès",
  CLIENTS_ADDED: "Clients ajoutés au groupe avec succès",
  CLIENTS_REMOVED: "Clients retirés du groupe avec succès",
} as const;