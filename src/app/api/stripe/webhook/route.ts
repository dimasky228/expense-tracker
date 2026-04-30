import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/src/lib/stripe";
import { createAdminClient } from "@/src/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  console.log("[stripe/webhook] received event:", event.type);

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[stripe/webhook] checkout.session.completed — customer:", session.customer, "metadata:", session.metadata);

      if (session.mode !== "subscription") {
        console.log("[stripe/webhook] not a subscription session, skipping");
        break;
      }

      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("[stripe/webhook] no userId in session metadata — cannot update subscription");
        break;
      }

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      let periodEnd: number | undefined;
      try {
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        periodEnd = (stripeSub as any).current_period_end as number | undefined;
      } catch (err) {
        console.error("[stripe/webhook] failed to retrieve subscription:", err);
      }

      const { error } = await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "pro",
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("[stripe/webhook] DB upsert failed:", error);
      } else {
        console.log("[stripe/webhook] subscription upgraded to pro for user:", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const customerId = stripeSub.customer as string;
      const status =
        stripeSub.status === "active"
          ? "pro"
          : stripeSub.status === "past_due"
          ? "past_due"
          : "canceled";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subPeriodEnd = (stripeSub as any).current_period_end as number | undefined;

      console.log("[stripe/webhook] customer.subscription.updated — customer:", customerId, "status:", status);

      const { error } = await admin
        .from("subscriptions")
        .update({
          stripe_subscription_id: stripeSub.id,
          status,
          current_period_end: subPeriodEnd ? new Date(subPeriodEnd * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("[stripe/webhook] DB update failed:", error);
      } else {
        console.log("[stripe/webhook] subscription updated for customer:", customerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const customerId = stripeSub.customer as string;

      console.log("[stripe/webhook] customer.subscription.deleted — customer:", customerId);

      const { error } = await admin
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("[stripe/webhook] DB update failed:", error);
      } else {
        console.log("[stripe/webhook] subscription canceled for customer:", customerId);
      }
      break;
    }

    default:
      console.log("[stripe/webhook] unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}
