export function isAuthSessionMissingError(error: { name?: string } | null) {
  return error?.name === "AuthSessionMissingError";
}
