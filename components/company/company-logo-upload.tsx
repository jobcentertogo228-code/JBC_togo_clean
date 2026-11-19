"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LoaderCircle, Upload } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function CompanyLogoUpload({
  companyId,
  userId,
  name,
  logoUrl,
  canManage,
}: {
  companyId: string;
  userId: string;
  name: string;
  logoUrl: string | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadLogo(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!allowedImageTypes.has(file.type) || !file.size || file.size > maxImageSize) {
      setError("Choisissez un logo JPG, PNG ou WebP de 5 Mo maximum.");
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData.user?.id !== userId) {
      setBusy(false);
      setError("Votre session a expiré. Reconnectez-vous puis réessayez.");
      return;
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice("image/".length);
    const path = `${userId}/${companyId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setBusy(false);
      setError("Le logo n’a pas pu être téléversé.");
      return;
    }

    const publicUrl = supabase.storage.from("company-logos").getPublicUrl(path).data.publicUrl;
    const { data: updated, error: updateError } = await supabase
      .from("companies")
      .update({ logo_path: publicUrl })
      .eq("id", companyId)
      .select("id")
      .maybeSingle();
    if (updateError || !updated) {
      const { error: cleanupError } = await supabase.storage.from("company-logos").remove([path]);
      setBusy(false);
      setError(cleanupError
        ? "Le logo est envoyé, mais son association a échoué et le fichier temporaire n’a pas pu être supprimé."
        : "Vous n’avez pas pu enregistrer ce logo pour l’entreprise.");
      return;
    }

    if (logoUrl?.includes("/storage/v1/object/public/company-logos/")) {
      const oldPath = logoUrl.split("/storage/v1/object/public/company-logos/")[1];
      if (oldPath?.startsWith(`${userId}/${companyId}/`)) {
        const { error: removeError } = await supabase.storage.from("company-logos").remove([oldPath]);
        if (removeError) console.error("Unable to remove previous company logo:", removeError);
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
      <Avatar className="h-20 w-20 shrink-0 rounded-xl" imageUrl={logoUrl} name={name} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Logo de l’entreprise</p>
        <p className="mt-1 text-sm text-muted-foreground">JPG, PNG ou WebP · 5 Mo maximum</p>
        {error && <Alert className="mt-3" variant="destructive">{error}</Alert>}
      </div>
      {canManage && (
        <>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void uploadLogo(event.currentTarget.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <Button disabled={busy} onClick={() => inputRef.current?.click()} type="button" variant="outline">
            {busy
              ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              : logoUrl ? <Upload aria-hidden="true" className="h-4 w-4" /> : <Building2 aria-hidden="true" className="h-4 w-4" />}
            {busy ? "Envoi…" : "Modifier le logo"}
          </Button>
        </>
      )}
    </div>
  );
}
