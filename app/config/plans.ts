export const PLANS = {
  starter: {
    name: "Starter",
    code: "starter",
    price: { monthly: 2900, yearly: 2400 },
    description: "Tout ce dont vous avez besoin pour débuter la digitalisation.",
    features: {
      users: 3,
      storage: 500,
      invoices: 100,
      clients: 50,
      hasReports: true,
      hasApiAccess: false,
      hasCustomBranding: false,
    },
    isPopular: false,
  },

  scale: {
    name: "Scale",
    code: "scale",
    price: { monthly: 7900, yearly: 6500 },
    description: "La flexibilité totale pour les entreprises en pleine croissance.",
    features: {
      users: 10,
      storage: 2048,
      invoices: 1000,
      clients: 500,
      hasReports: true,
      hasApiAccess: true,
      hasCustomBranding: true,
    },
    isPopular: true,
  },

  growth: {
    name: "Growth",
    code: "growth",
    price: { monthly: 15000, yearly: 12500 },
    description: "Le summum de la puissance pour les grandes structures.",
    features: {
      users: 99,
      storage: 10240,
      invoices: 9999,
      clients: 9999,
      hasReports: true,
      hasApiAccess: true,
      hasCustomBranding: true,
    },
    isPopular: false,
  },
};