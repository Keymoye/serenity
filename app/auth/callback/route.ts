import { NextResponse } from "next/server";
import { getSupabaseServerAuthClient } from "@/lib/infra/supabase/authClient";

export async function GET(_request: Request) {
  const supabase = await getSupabaseServerAuthClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return NextResponse.redirect("/auth/login");
  }

  // optionally you could set a redirect cookie or preserve original intent
  return NextResponse.redirect("/dashboard");
}
