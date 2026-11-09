"use server";

import { redirect } from "next/navigation";

// Define the shape of the state returned to useActionState
export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
} | null;

export async function handlePlanSelection(prevState: ActionState, formData: FormData) {
  const planCode = formData.get("planCode") as string;
  const billingCycle = formData.get("billingCycle") as string;

  // 1. Validate the data
  if (!planCode || !billingCycle) {
    return {
      success: false,
      message: "Missing plan information.",
    };
  }

  try {
    // 2. Simulate logic (e.g., creating a Stripe Checkout session or updating DB)
    console.log(`Processing ${planCode} on a ${billingCycle} basis...`);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Artificial delay

    // 3. Return success (or use redirect)
    return {
      success: true,
      message: "Success! Redirecting to checkout...",
    };
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }

  // Example: redirect("/checkout"); 
}