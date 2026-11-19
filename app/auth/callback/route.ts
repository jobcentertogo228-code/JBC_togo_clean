import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { AccountRole, Database } from "@/types/database";
import { safeNextPath } from "@/lib/auth/redirects";
import { companySetupSchema } from "@/lib/auth/schemas";
import { lookupProfileForUser } from "@/lib/auth/profile";
import { createSupabaseActionClient } from "@/lib/supabase/server";

const otpTypes = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);
const maxAuthParameterLength = 4096;
const maxErrorMessageLength = 500;
const maxNextPathLength = 2048;

type AuthClient = SupabaseClient<Database>;

function callbackError(message: string, request: NextRequest) {
  const url = new URL("/auth/erreur", request.url);
  url.searchParams.set("type", "callback");
  url.searchParams.set("message", message.slice(0, maxErrorMessageLength));
  return NextResponse.redirect(url);
}

function errorDetails(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const authError = error as {
      name?: unknown;
      message?: unknown;
      status?: unknown;
      code?: unknown;
    };
    return {
      name: typeof authError.name === "string" ? authError.name : undefined,
      message: typeof authError.message === "string"
        ? authError.message
        : "Erreur inconnue pendant le callback d’authentification.",
      status: typeof authError.status === "number" ? authError.status : undefined,
      code: typeof authError.code === "string" ? authError.code : undefined,
    };
  }

  return { message: "Erreur inconnue pendant le callback d’authentification." };
}

function logCallbackError(requestId: string, stage: string, error: unknown) {
  console.error("Auth callback error", {
    requestId,
    stage,
    error: errorDetails(error),
  });
}

function roleDestination(role: AccountRole) {
  switch (role) {
    case "candidate":
      return "/candidate";
    case "company":
      return "/company/setup";
    case "admin":
      return "/admin";
  }
}

async function verifyOtp(
  supabase: AuthClient,
  requestId: string,
  tokenHash: string,
  type: string,
) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  console.log("Verify OTP result", {
    requestId,
    type,
    hasUser: Boolean(data.user),
    hasSession: Boolean(data.session),
    error: error ? errorDetails(error) : null,
  });

  if (error) {
    logCallbackError(requestId, "verifyOtp", error);
    return error.message;
  }
  if (!data.user || !data.session) {
    const message = "Supabase n’a pas créé de session après la vérification du lien.";
    logCallbackError(requestId, "verifyOtp", { message });
    return message;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const requestedNext = params.get("next");
  const next = safeNextPath(
    requestedNext && requestedNext.length <= maxNextPathLength ? requestedNext : null,
    "/candidate",
  );
  const providerError = params.get("error");
  const providerErrorCode = params.get("error_code");
  const providerErrorDescription = params.get("error_description");

  console.log("Auth callback params", {
    requestId,
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type: type?.slice(0, 40) ?? null,
    next,
    providerError: providerError?.slice(0, 100) ?? null,
    providerErrorCode: providerErrorCode?.slice(0, 100) ?? null,
  });

  if (providerError || providerErrorCode || providerErrorDescription) {
    const message = providerErrorDescription || providerError || providerErrorCode || "Supabase a rejeté le lien de confirmation.";
    logCallbackError(requestId, "supabase_redirect", {
      message,
      code: providerErrorCode ?? providerError ?? undefined,
    });
    return callbackError(message, request);
  }

  const invalidParameters =
    (!code && !tokenHash)
    || Boolean(code && code.length > maxAuthParameterLength)
    || Boolean(tokenHash && tokenHash.length > maxAuthParameterLength);
  if (invalidParameters) {
    const message = "Le lien de confirmation est invalide ou incomplet. Demandez un nouveau lien.";
    logCallbackError(requestId, "parameters", {
      message,
      hasCode: Boolean(code),
      hasTokenHash: Boolean(tokenHash),
      codeTooLong: Boolean(code && code.length > maxAuthParameterLength),
      tokenHashTooLong: Boolean(tokenHash && tokenHash.length > maxAuthParameterLength),
    });
    return callbackError(message, request);
  }

  if (!code && tokenHash && (!type || !otpTypes.has(type))) {
    const message = "Le type du lien de confirmation est manquant ou invalide. Demandez un nouveau lien.";
    logCallbackError(requestId, "otp_type", { message, type: type?.slice(0, 40) ?? null });
    return callbackError(message, request);
  }

  try {
    const supabase = await createSupabaseActionClient();

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      console.log("Exchange session result", {
        requestId,
        hasUser: Boolean(data.user),
        hasSession: Boolean(data.session),
        error: error ? errorDetails(error) : null,
      });

      if (error || !data.user || !data.session) {
        const canFallbackToOtp = Boolean(tokenHash && type && otpTypes.has(type));
        if (canFallbackToOtp && tokenHash && type) {
          console.warn("[auth/callback] Échange du code impossible, tentative avec token_hash.", {
            requestId,
            error: error ? errorDetails(error) : null,
          });
          const otpError = await verifyOtp(supabase, requestId, tokenHash, type);
          if (otpError) return callbackError(otpError, request);
        } else {
          const isMissingPkceVerifier = Boolean(
            error?.message?.toLowerCase().includes("code verifier")
            || error?.message?.toLowerCase().includes("pkce"),
          );
          const message = isMissingPkceVerifier
            ? "La confirmation e-mail n’a pas pu être ouverte dans cette session. Rouvrez le lien dans le même navigateur dans lequel l’inscription a été créée, puis demandez un nouveau lien si nécessaire."
            : error?.message ?? "Supabase n’a pas créé de session après l’échange du code.";
          logCallbackError(requestId, "exchangeCodeForSession", error ?? { message });
          return callbackError(message, request);
        }
      }
    } else if (tokenHash && type) {
      const otpError = await verifyOtp(supabase, requestId, tokenHash, type);
      if (otpError) return callbackError(otpError, request);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      logCallbackError(requestId, "getUser", userError);
      return callbackError(userError.message, request);
    }
    if (!userData.user) {
      const message = "La confirmation est terminée, mais aucune session utilisateur n’a été créée.";
      logCallbackError(requestId, "getUser", { message });
      return callbackError(message, request);
    }

    const { profile, error: profileError } = await lookupProfileForUser(
      supabase,
      userData.user,
      "auth/callback",
    );

    if (profileError) {
      logCallbackError(requestId, "profile", profileError);
      return callbackError(profileError.message, request);
    }
    if (!profile) {
      const message = "La session est active, mais aucun profil JOB-CENTER n’est associé à ce compte.";
      logCallbackError(requestId, "profile", { message });
      return callbackError(message, request);
    }

    console.info("[auth/callback] Profil chargé après confirmation.", {
      requestId,
      userId: userData.user.id,
      role: profile.account_role,
    });

    const isPasswordRecovery = next === "/reinitialiser-mot-de-passe" && (!type || type === "recovery");
    const companySetup = companySetupSchema.safeParse({
      companyName: userData.user.user_metadata.company_name,
      companySlug: userData.user.user_metadata.company_slug,
    });
    const isCompanySignup = profile.account_role === "company" || companySetup.success;
    let destination: string;

    if (isPasswordRecovery) {
      destination = next;
    } else if (isCompanySignup) {
      const { data: membership, error: membershipError } = await supabase
        .from("company_memberships")
        .select("company_id, role, status")
        .eq("profile_id", userData.user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        logCallbackError(requestId, "company_membership_lookup", membershipError);
        return callbackError(membershipError.message, request);
      }

      console.info("[auth/callback] Vérification du membership entreprise.", {
        requestId,
        userId: userData.user.id,
        membershipFound: Boolean(membership),
        membershipRole: membership?.role ?? null,
        membershipStatus: membership?.status ?? null,
      });

      if (membership) {
        destination = "/company";
      } else {
        if (!companySetup.success) {
          console.warn("[auth/callback] Métadonnées entreprise absentes ou invalides; redirection vers la configuration.", {
            requestId,
            userId: userData.user.id,
          });
          destination = "/company/setup";
        } else {
          console.info("[auth/callback] Création de l’entreprise à la confirmation.", {
            requestId,
            userId: userData.user.id,
          });
          const { data: companyId, error: companyError } = await supabase.rpc("create_company", {
            p_name: companySetup.data.companyName,
            p_slug: companySetup.data.companySlug,
          });

          console.info("[auth/callback] Résultat create_company.", {
            requestId,
            userId: userData.user.id,
            companyId: companyId ?? null,
            success: !companyError,
            error: companyError ? errorDetails(companyError) : null,
          });

          if (companyError) {
            logCallbackError(requestId, "create_company", companyError);
            destination = "/company/setup?error=creation";
          } else {
            const { data: createdMembership, error: createdMembershipError } = await supabase
              .from("company_memberships")
              .select("company_id, role, status")
              .eq("profile_id", userData.user.id)
              .eq("company_id", companyId)
              .eq("role", "owner")
              .eq("status", "active")
              .maybeSingle();

            if (createdMembershipError || !createdMembership) {
              const error = createdMembershipError ?? new Error("Le membership owner actif n’a pas été créé.");
              logCallbackError(requestId, "company_membership_verification", error);
              destination = "/company/setup?error=creation";
            } else {
              console.info("[auth/callback] Membership owner actif créé et vérifié.", {
                requestId,
                userId: userData.user.id,
                companyId: createdMembership.company_id,
                role: createdMembership.role,
                status: createdMembership.status,
              });
              destination = "/company";
            }
          }
        }
      }
    } else {
      destination = roleDestination(profile.account_role);
    }

    console.info("[auth/callback] Callback terminé.", {
      requestId,
      userId: userData.user.id,
      role: isCompanySignup ? "company" : profile.account_role,
      destination,
    });

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    const details = errorDetails(error);
    logCallbackError(requestId, "unexpected", details);
    return callbackError(details.message, request);
  }
}
