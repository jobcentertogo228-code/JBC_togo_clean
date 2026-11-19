"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function CandidateAvatarUpload({
  candidateId,
  photoUrl,
  displayName,
}: {
  candidateId: string;
  photoUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPhoto() {
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    if (!allowedImageTypes.has(file.type) || file.size === 0 || file.size > maxImageSize) {
      setError("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum.");
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData.user?.id !== candidateId) {
      setBusy(false);
      setError("Votre session a expiré. Reconnectez-vous puis réessayez.");
      return;
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice("image/".length);
    const storagePath = `${candidateId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("candidate-avatars")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setBusy(false);
      setError("La photo n’a pas pu être téléversée. Réessayez.");
      return;
    }

    const { error: updateError } = await supabase
      .from("candidates")
      .update({ photo_url: storagePath })
      .eq("profile_id", candidateId);
    if (updateError) {
      const { error: cleanupError } = await supabase.storage.from("candidate-avatars").remove([storagePath]);
      setBusy(false);
      setError(cleanupError
        ? "La photo a été envoyée mais n’a pas pu être associée à votre profil."
        : "La photo n’a pas pu être enregistrée dans votre profil.");
      return;
    }

    const publicMarker = "/storage/v1/object/public/candidate-avatars/";
    const signedMarker = "/storage/v1/object/sign/candidate-avatars/";
    const oldMarker = photoUrl?.includes(publicMarker)
      ? publicMarker
      : photoUrl?.includes(signedMarker)
        ? signedMarker
        : null;
    const oldPath = oldMarker
      ? photoUrl?.split(oldMarker).pop()?.split("?")[0]
      : photoUrl;
    if (oldPath?.startsWith(`${candidateId}/`)) {
      const { error: removeError } = await supabase.storage.from("candidate-avatars").remove([oldPath]);
      if (removeError) console.error("Unable to remove previous candidate avatar:", removeError);
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
      <Avatar className="h-20 w-20 shrink-0 rounded-full" imageUrl={photoUrl} name={displayName} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Photo de profil</p>
        <p className="mt-1 text-sm text-muted-foreground">JPG, PNG ou WebP · 5 Mo maximum</p>
        {error && <Alert className="mt-3" variant="destructive">{error}</Alert>}
      </div>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={() => void uploadPhoto()}
        ref={inputRef}
        type="file"
      />
      <Button disabled={busy} onClick={() => inputRef.current?.click()} type="button" variant="outline">
        {busy
          ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          : <Camera aria-hidden="true" className="h-4 w-4" />}
        {busy ? "Envoi…" : "Modifier la photo"}
      </Button>
    </div>
  );
}
