import type { AccountRole } from "@/types/database";

const allowedNextPrefixes = [
  "/candidate",
  "/company",
  "/admin",
  "/emplois",
  "/reinitialiser-mot-de-passe",
];

export function safeNextPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (!allowedNextPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`))) {
    return fallback;
  }

  return value;
}

export function roleDestination(role: AccountRole) {
  if (role === "company") return "/company";
  if (role === "admin") return "/admin";
  return "/candidate";
}
