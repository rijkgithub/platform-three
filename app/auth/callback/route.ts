import { Database } from "@/types/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const next = requestUrl.searchParams.get("next") || "/";
  const error_description = requestUrl.searchParams.get("error_description");

  console.log("Auth callback initiated", { code, error, next, error_description });

  if (error) {
    console.error("Auth error received:", { error, error_description });
    return NextResponse.redirect(`${requestUrl.origin}/login/failed?err=${error}`);
  }

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${requestUrl.origin}/login/failed?err=ExchangeError`);
      }

      console.log("Session established successfully");

      const { data: user, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error getting user:", userError);
        return NextResponse.redirect(`${requestUrl.origin}/login/failed?err=UserFetchError`);
      }

      console.log("User fetched successfully:", user.user.id);

    } catch (error) {
      console.error("Unexpected error during authentication:", error);
      return NextResponse.redirect(`${requestUrl.origin}/login/failed?err=UnexpectedError`);
    }
  } else {
    console.error("No code received in callback");
    return NextResponse.redirect(`${requestUrl.origin}/login/failed?err=NoCode`);
  }

  console.log("Redirecting to:", next);
  return NextResponse.redirect(new URL(next, req.url));
}
