import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getSubscription, isPro } from "@/src/lib/subscription";
import DashboardNavbar from "@/src/components/DashboardNavbar";
import BottomNav from "@/src/components/BottomNav";

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
      {/* Extra bottom padding on mobile for bottom nav */}
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
