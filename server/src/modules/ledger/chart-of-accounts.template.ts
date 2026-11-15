/**
 * Algerian SCF-compatible chart of accounts template.
 *
 * Contract: docs/adr/0004-ledger.md
 *
 * This is DATA, not code: seeding copies these rows into a tenant's own
 * `accounts` table, after which the tenant owns them and may rename, renumber,
 * add or deactivate anything. Nothing in the application refers to these codes.
 * Posting resolves accounts by `systemRole`, so a tenant that replaces this
 * template entirely keeps working as long as it fills the same roles.
 *
 * Structure follows the Plan Comptable National (SCF) class scheme:
 *   1 Comptes de ressources durables   2 Comptes d'actif immobilisé
 *   3 Comptes de stocks                4 Comptes de tiers
 *   5 Comptes financiers               6 Comptes de charges
 *   7 Comptes de produits              8 Comptes des engagements
 *
 * This is a MINIMAL template: it contains the classes and the accounts the
 * posting engine needs, not the full SCF. Completing it is a data task for the
 * operator, not a code change — which is the point of keeping it here.
 */

import type { PostingTemplate } from "./ledger.service";

export const ALGERIAN_SCF_TEMPLATE_VERSION = "2026.1";

export const ALGERIAN_SCF: PostingTemplate[] = [
  /* ---------------- Class 1: ressources durables ---------------- */
  { code: "1", name: "Comptes de ressources durables", type: "equity", parentCode: null, systemRole: null, isPostable: false },
  { code: "10", name: "Capital et réserves", type: "equity", parentCode: "1", systemRole: null, isPostable: false },
  { code: "101", name: "Capital social", type: "equity", parentCode: "10", systemRole: null, isPostable: true },
  { code: "12", name: "Résultat de l'exercice", type: "equity", parentCode: "1", systemRole: null, isPostable: true },
  { code: "16", name: "Emprunts et dettes assimilées", type: "liability", parentCode: "1", systemRole: null, isPostable: false },
  { code: "164", name: "Emprunts auprès des établissements de crédit", type: "liability", parentCode: "16", systemRole: null, isPostable: true },

  /* ---------------- Class 2: actif immobilisé ---------------- */
  { code: "2", name: "Comptes d'actif immobilisé", type: "asset", parentCode: null, systemRole: null, isPostable: false },
  { code: "21", name: "Immobilisations corporelles", type: "asset", parentCode: "2", systemRole: null, isPostable: false },
  { code: "215", name: "Matériel et outillage", type: "asset", parentCode: "21", systemRole: null, isPostable: true },

  /* ---------------- Class 3: stocks ---------------- */
  { code: "3", name: "Comptes de stocks", type: "asset", parentCode: null, systemRole: null, isPostable: false },
  { code: "30", name: "Stocks de marchandises", type: "asset", parentCode: "3", systemRole: null, isPostable: true },
  { code: "31", name: "Matières premières et fournitures", type: "asset", parentCode: "3", systemRole: null, isPostable: true },

  /* ---------------- Class 4: tiers ---------------- */
  { code: "4", name: "Comptes de tiers", type: "liability", parentCode: null, systemRole: null, isPostable: false },
  { code: "40", name: "Fournisseurs et comptes rattachés", type: "liability", parentCode: "4", systemRole: null, isPostable: false },
  {
    code: "401",
    name: "Fournisseurs",
    type: "liability",
    parentCode: "40",
    systemRole: "payable",
    isPostable: true,
    description: "Dettes envers les fournisseurs. Rôle: payable.",
  },
  { code: "44", name: "État et collectivités publiques", type: "liability", parentCode: "4", systemRole: null, isPostable: false },
  {
    code: "4457",
    name: "TVA collectée (facturée)",
    type: "liability",
    parentCode: "44",
    systemRole: "vat_output",
    isPostable: true,
    description: "TVA facturée aux clients. Rôle: vat_output.",
  },
  {
    code: "4456",
    name: "TVA déductible",
    type: "asset",
    parentCode: "44",
    systemRole: "vat_input",
    isPostable: true,
    description: "TVA récupérable sur achats. Rôle: vat_input.",
  },
  {
    code: "411",
    name: "Clients",
    type: "asset",
    parentCode: "4",
    systemRole: "receivable",
    isPostable: true,
    description: "Créances sur les clients. Rôle: receivable.",
  },

  /* ---------------- Class 5: financiers ---------------- */
  { code: "5", name: "Comptes financiers", type: "asset", parentCode: null, systemRole: null, isPostable: false },
  {
    code: "512",
    name: "Banque",
    type: "asset",
    parentCode: "5",
    systemRole: "bank",
    isPostable: true,
    description: "Comptes bancaires. Rôle: bank.",
  },
  {
    code: "53",
    name: "Caisse",
    type: "asset",
    parentCode: "5",
    systemRole: "cash",
    isPostable: true,
    description: "Espèces en caisse. Rôle: cash.",
  },

  /* ---------------- Class 6: charges ---------------- */
  { code: "6", name: "Comptes de charges", type: "expense", parentCode: null, systemRole: null, isPostable: false },
  { code: "60", name: "Achats et variations de stocks", type: "expense", parentCode: "6", systemRole: null, isPostable: false },
  { code: "607", name: "Achats de marchandises", type: "expense", parentCode: "60", systemRole: null, isPostable: true },
  {
    code: "609",
    name: "Rabais, remises et ristournes obtenus",
    type: "expense",
    parentCode: "6",
    systemRole: null,
    isPostable: true,
  },

  /* ---------------- Class 7: produits ---------------- */
  { code: "7", name: "Comptes de produits", type: "revenue", parentCode: null, systemRole: null, isPostable: false },
  { code: "70", name: "Ventes et produits annexes", type: "revenue", parentCode: "7", systemRole: null, isPostable: false },
  {
    code: "701",
    name: "Ventes de marchandises",
    type: "revenue",
    parentCode: "70",
    systemRole: "revenue",
    isPostable: true,
    description: "Chiffre d'affaires. Rôle: revenue.",
  },
  {
    code: "709",
    name: "Rabais, remises et ristournes accordés",
    type: "revenue",
    parentCode: "7",
    systemRole: "discount_allowed",
    isPostable: true,
    description:
      "Remises accordées aux clients. Contra-produit: normalement débitrice. Rôle: discount_allowed.",
  },
];

/**
 * Verifies the template is internally consistent before it is written.
 *
 * Called by the seeder: a template with a duplicate code, a dangling parent or
 * a missing system role would seed a chart that posting cannot use, and the
 * failure would surface as a 422 at the first invoice rather than at setup.
 */
export function assertTemplateUsable(
  template: PostingTemplate[],
  requiredRoles: readonly string[],
): void {
  const codes = new Set<string>();
  for (const account of template) {
    if (codes.has(account.code)) {
      throw new Error(`Duplicate account code in template: ${account.code}`);
    }
    codes.add(account.code);
  }
  for (const account of template) {
    if (account.parentCode !== null && !codes.has(account.parentCode)) {
      throw new Error(
        `Account ${account.code} references missing parent ${account.parentCode}`,
      );
    }
  }
  const roles = new Set(template.map((account) => account.systemRole).filter(Boolean) as string[]);
  const missing = requiredRoles.filter((role) => !roles.has(role));
  if (missing.length > 0) {
    throw new Error(`Template does not provide these system roles: ${missing.join(", ")}`);
  }
}
