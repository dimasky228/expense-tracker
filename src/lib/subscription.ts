import { createClient } from "@/src/lib/supabase/server";
import type { AppSupabaseClient } from "@/src/lib/api-auth";

export type Subscription = {
  status: "free" | "pro" | "canceled" | "past_due";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

export async function getSubscription(
  userId: string,
  client?: AppSupabaseClient
): Promise<Subscription> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("subscriptions")
    .select("status, stripe_customer_id, stripe_subscription_id, current_period_end")
    .eq("user_id", userId)
    .single();

  return (
    data ?? {
      status: "free",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    }
  );
}

export function isPro(sub: Subscription): boolean {
  return sub.status === "pro";
}

export function getUsageLimits(sub: Subscription) {
  const pro = isPro(sub);
  return {
    csvImportsPerMonth: pro ? Infinity : 3,
    receiptScansPerMonth: pro ? Infinity : 5,
    canExportPdf: pro,
    canUseInsights: pro,
  };
}
