import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { AccountRole, Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { lookupProfileForUser } from "@/lib/auth/profile";
import { roleDestination } from "@/lib/auth/redirects";

const protectedPrefixes = ["/candidate", "/company", "/admin"];
const accountPages = ["/connexion", "/inscription"];

function isPathUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function middleware(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isCompanySetup = pathname === "/company/setup";
  const isProtected = !isCompanySetup && protectedPrefixes.some((prefix) => isPathUnder(pathname, prefix));

  if (authError && authError.name !== "AuthSessionMissingError" && isProtected) {
    const target = new URL("/auth/erreur", request.url);
    target.searchParams.set("type", "session");
    return copyCookies(response, NextResponse.redirect(target));
  }

  if (isProtected || isCompanySetup) {
    if (!authData.user) {
      const target = new URL("/connexion", request.url);
      target.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return copyCookies(response, NextResponse.redirect(target));
    }

    const { profile, error: profileError } = await lookupProfileForUser(
      supabase,
      authData.user,
      "middleware/protected",
    );

    if (profileError || !profile) {
      const target = new URL("/auth/erreur", request.url);
      target.searchParams.set("type", "profile");
      return copyCookies(response, NextResponse.redirect(target));
    }

    const role = profile.account_role as AccountRole;

    if (isCompanySetup) {
      if (role === "company") {
        const { data: membership, error } = await supabase
          .from("company_memberships")
          .select("company_id")
          .eq("profile_id", authData.user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        if (error) {
          const target = new URL("/auth/erreur", request.url);
          target.searchParams.set("type", "membership");
          return copyCookies(response, NextResponse.redirect(target));
        }

        if (membership) {
          return copyCookies(response, NextResponse.redirect(new URL("/company", request.url)));
        }
      }

      return response;
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return copyCookies(response, NextResponse.redirect(new URL(roleDestination(role), request.url)));
    }

    if (pathname.startsWith("/company") && role !== "company" && role !== "admin") {
      return copyCookies(response, NextResponse.redirect(new URL(roleDestination(role), request.url)));
    }

    if (pathname.startsWith("/company") && role === "company") {
      const { data: membership, error } = await supabase
        .from("company_memberships")
        .select("company_id")
        .eq("profile_id", authData.user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (error || !membership) {
        const target = new URL(error ? "/auth/erreur" : "/company/setup", request.url);
        if (error) target.searchParams.set("type", "membership");
        return copyCookies(response, NextResponse.redirect(target));
      }
    }

    if (pathname.startsWith("/candidate") && role !== "candidate" && role !== "admin") {
      return copyCookies(response, NextResponse.redirect(new URL(roleDestination(role), request.url)));
    }
  } else if (authData.user && accountPages.some((page) => isPathUnder(pathname, page))) {
    const { profile, error } = await lookupProfileForUser(
      supabase,
      authData.user,
      "middleware/account-page",
    );

    if (error || !profile) {
      const target = new URL("/auth/erreur", request.url);
      target.searchParams.set("type", "profile");
      return copyCookies(response, NextResponse.redirect(target));
    }

    return copyCookies(
      response,
      NextResponse.redirect(new URL(roleDestination(profile.account_role as AccountRole), request.url)),
    );
  }

  return response;
}

function copyCookies(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    destination.cookies.set(name, value, options);
  });
  return destination;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*\\.js|fallback-.*\\.js|manifest\\.json|offline(?:/|$)|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
