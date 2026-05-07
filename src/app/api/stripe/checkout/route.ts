import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/lib/api-auth";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getStripe } from "@/src/lib/stripe";

export async function POST(request: Request) {
  const { user, error: authError } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });

  const stripe = getStripe();
  const admin = createAdminClient();

  // Get or create Stripe customer
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await admin
      .from("subscriptions")
      .upsert({ user_id: user.id, stripe_customer_id: customerId, status: "free" });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/dashboard`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
