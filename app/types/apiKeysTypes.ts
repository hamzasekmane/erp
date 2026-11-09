// ========================
// ✅ TYPES AND CONSTANTS
// ========================

export type ApiKey = {
  id: string;
  name: string;
  keyMasked: string;
  permissions: string[];
  scopes: string[];
  lastUsed: string | null;
  expiresAt: string | null;
  isActive: boolean;
  requestsCount: number;
  rateLimit: number;
  createdAt: string;
};

export type ApiKeysState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: {
    keys: ApiKey[];
    newKey?: string;
  };
};

export const initialApiKeysState: ApiKeysState = {
  success: true,
  message: "",
  data: { keys: [] }
};