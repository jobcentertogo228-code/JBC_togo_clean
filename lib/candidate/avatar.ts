import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type CandidateStorageClient = SupabaseClient<Database>;

export async function getCandidateAvatarUrl(
  supabase: CandidateStorageClient,
  candidateId: string,
  storedValue: string | null,
) {
  if (!storedValue) return null;

  const publicMarker = "/storage/v1/object/public/candidate-avatars/";
  const signedMarker = "/storage/v1/object/sign/candidate-avatars/";
  const marker = storedValue.includes(publicMarker)
    ? publicMarker
    : storedValue.includes(signedMarker)
      ? signedMarker
      : null;
  const path = marker
    ? storedValue.split(marker).pop()?.split("?")[0]
    : storedValue;

  if (!path || !path.startsWith(`${candidateId}/`)) {
    return marker || !storedValue.startsWith("https://") ? null : storedValue;
  }

  const { data, error } = await supabase.storage
    .from("candidate-avatars")
    .createSignedUrl(path, 300);
  if (error) {
    console.error("[candidate/avatar] Unable to create signed avatar URL", {
      userId: candidateId,
      error: {
        message: error.message,
        statusCode: error.statusCode,
      },
    });
    return null;
  }
  return data.signedUrl;
}
