import type { AuthActionState } from "@/app/actions/auth";

export function AuthFeedback({ state }: { state: AuthActionState }) {
  if (state.error) {
    return <p className="feedback feedback-error" role="alert">{state.error}</p>;
  }

  if (state.message) {
    return <p className="feedback feedback-success" role="status">{state.message}</p>;
  }

  return null;
}
