"use client";

import { useSearchParams } from "next/navigation";
import { PLANS } from "../config/plans";

export default function CheckoutPage() {
  const params = useSearchParams();
  const planId = params.get("plan") || "free";
  const billing = params.get("billing") || "mensuel";

  const plan = PLANS[planId as keyof typeof PLANS];
  const price = billing === "mensuel" ? plan.price.monthly : plan.price.yearly;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
      <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md">
        <h1 className="text-3xl font-black mb-6">Checkout</h1>

        <p className="mb-2">{plan.name}</p>
        <p className="text-4xl font-bold mb-6">
          {price}€ / {billing}
        </p>

        <button className="w-full py-4 bg-blue-600 rounded-xl font-bold">
          Payer maintenant
        </button>
      </div>
    </main>
  );
}