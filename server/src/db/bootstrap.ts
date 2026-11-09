import { getDb } from "./client";
import { plans } from "./schema";
import { newId } from "../shared/ids";

/** Plans the product ships with. Idempotent: safe to run on every boot. */
const BASELINE_PLANS = [
  {
    code: "trial",
    name: "Essai gratuit",
    description: "14 jours pour découvrir la plateforme",
    priceMonthlyMinor: 0,
    priceYearlyMinor: 0,
    trialDays: 14,
    sortOrder: 0,
    features: { invoices: true, clients: true, catalog: true, reports: true },
    limits: { maxUsers: 3, invoicesPerMonth: 50, storageMb: 500 },
  },
  {
    code: "starter",
    name: "Starter",
    description: "Pour les petites entreprises",
    priceMonthlyMinor: 290_000,
    priceYearlyMinor: 2_900_000,
    trialDays: 14,
    sortOrder: 1,
    features: { invoices: true, clients: true, catalog: true, reports: true, payments: true },
    limits: { maxUsers: 5, invoicesPerMonth: 500, storageMb: 2_000 },
  },
  {
    code: "professional",
    name: "Professionnel",
    description: "Pour les équipes en croissance",
    priceMonthlyMinor: 790_000,
    priceYearlyMinor: 7_900_000,
    trialDays: 14,
    sortOrder: 2,
    features: { invoices: true, clients: true, catalog: true, reports: true, payments: true, hr: true, api: true },
    limits: { maxUsers: 20, invoicesPerMonth: 5_000, storageMb: 10_000 },
  },
  {
    code: "enterprise",
    name: "Entreprise",
    description: "Grands comptes, limites étendues",
    priceMonthlyMinor: 1_990_000,
    priceYearlyMinor: 19_900_000,
    trialDays: 30,
    sortOrder: 3,
    features: { invoices: true, clients: true, catalog: true, reports: true, payments: true, hr: true, api: true, sso: true },
    limits: { maxUsers: 200, invoicesPerMonth: 100_000, storageMb: 100_000 },
  },
] as const;

export async function ensureBaselinePlans(): Promise<void> {
  const db = getDb();
  for (const plan of BASELINE_PLANS) {
    await db
      .insert(plans)
      .values({
        id: newId(),
        code: plan.code,
        name: plan.name,
        description: plan.description,
        priceMonthlyMinor: plan.priceMonthlyMinor,
        priceYearlyMinor: plan.priceYearlyMinor,
        trialDays: plan.trialDays,
        sortOrder: plan.sortOrder,
        features: { ...plan.features },
        limits: { ...plan.limits },
      })
      .onConflictDoNothing();
  }
}
