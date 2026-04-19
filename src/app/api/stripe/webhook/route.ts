import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/src/lib/stripe";
import { createAdminClient } from "@/src/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Test mode: skip signature verification
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || session.mode !== "subscription") break;

      const subscriptionId = session.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = (stripeSub as any).current_period_end as number | undefined;

      await admin.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        status: "pro",
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const customerId = stripeSub.customer as string;
      const status = stripeSub.status === "active" ? "pro" : stripeSub.status === "past_due" ? "past_due" : "canceled";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subPeriodEnd = (stripeSub as any).current_period_end as number | undefined;

      await admin
        .from("subscriptions")
        .update({
          stripe_subscription_id: stripeSub.id,
          status,
          current_period_end: subPeriodEnd ? new Date(subPeriodEnd * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const customerId = stripeSub.customer as string;

      await admin
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
