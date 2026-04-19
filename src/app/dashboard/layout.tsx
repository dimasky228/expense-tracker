import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getSubscription, isPro } from "@/src/lib/subscription";
import DashboardNavbar from "@/src/components/DashboardNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sub = await getSubscription(user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardNavbar
        email={user.email ?? ""}
        isPro={isPro(sub)}
        hasStripeCustomer={!!sub.stripe_customer_id}
      />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
