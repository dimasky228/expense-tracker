import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/lib/api-auth";
import { createAdminClient } from "@/src/lib/supabase/admin";

export async function DELETE(request: Request) {
  const { user, error: authError } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Delete user data in order (child tables first)
  await admin.from("transactions").delete().eq("user_id", user.id);
  await admin.from("usage").delete().eq("user_id", user.id);
  await admin.from("subscriptions").delete().eq("user_id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
