import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";
import type { User } from "@supabase/supabase-js";

export type AppSupabaseClient = SupabaseClient<Database>;

type AuthSuccess = { user: User; supabase: AppSupabaseClient; error: null };
type AuthFailure = { user: null; supabase: null; error: string };
export type AuthResult = AuthSuccess | AuthFailure;

export async function getAuthUser(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    ) as AppSupabaseClient;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { user: null, supabase: null, error: "Invalid token" };
    return { user, supabase, error: null };
  }

  // Cookie-based auth (web)
  try {
    const supabase = (await createServerClient()) as AppSupabaseClient;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { user: null, supabase: null, error: "Not authenticated" };
    return { user, supabase, error: null };
  } catch {
    return { user: null, supabase: null, error: "Auth failed" };
  }
}
