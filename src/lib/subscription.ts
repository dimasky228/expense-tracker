import { createClient } from "@/src/lib/supabase/server";

export type Subscription = {
  status: "free" | "pro" | "canceled" | "past_due";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

export async function getSubscription(userId: string): Promise<Subscription> {
  const supabase = await createClient();
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
    canExportPdf: pro,
    canUseInsights: pro,
  };
}
