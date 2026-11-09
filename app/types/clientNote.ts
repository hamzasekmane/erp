import { z } from "zod";

// Schéma pour une note client
export const ClientNoteSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().optional().default(""),
  clientId: z.object({
    _id: z.string(),
    name: z.string(),
    code: z.string().optional(),
  }).or(z.string()),
  createdBy: z.object({
    _id: z.string(),
    name: z.string(),
  }).or(z.string()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(),
  isPinned: z.boolean().default(false),
  category: z.enum(['general', 'follow-up', 'important', 'reminder']).default('general'),
});

// Schéma pour la création d'une note
export const CreateClientNoteSchema = ClientNoteSchema.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true,
  createdBy: true 
}).partial({
  content: true,
});

// Schéma pour la mise à jour d'une note
export const UpdateClientNoteSchema = CreateClientNoteSchema.partial();

// Schéma pour la réponse API (liste de notes)
export const ClientNotesResponseSchema = z.object({
  data: z.array(ClientNoteSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }).optional(),
});

// Types inférés
export type ClientNote = z.infer<typeof ClientNoteSchema>;
export type CreateClientNote = z.infer<typeof CreateClientNoteSchema>;
export type UpdateClientNote = z.infer<typeof UpdateClientNoteSchema>;
export type ClientNotesResponse = z.infer<typeof ClientNotesResponseSchema>;