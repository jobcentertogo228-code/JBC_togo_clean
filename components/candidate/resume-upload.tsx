"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const maxFileSize = 10 * 1024 * 1024;

export function ResumeUpload({ candidateId, hasDefault }: { candidateId: string; hasDefault: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMessage({ kind: "error", text: "Choisissez un fichier CV à téléverser." });
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setMessage({ kind: "error", text: "Le CV doit être au format PDF." });
      return;
    }
    if (file.size === 0 || file.size > maxFileSize) {
      setMessage({ kind: "error", text: "Le fichier doit peser entre 1 octet et 10 Mo." });
      return;
    }
    if (await file.slice(0, 5).text() !== "%PDF-") {
      setMessage({ kind: "error", text: "Le fichier sélectionné ne semble pas être un PDF valide." });
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user || authData.user.id !== candidateId) {
      setBusy(false);
      setMessage({ kind: "error", text: "Votre session a expiré. Reconnectez-vous puis réessayez." });
      return;
    }

    const safeName = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
    const storagePath = `${candidateId}/${crypto.randomUUID()}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("candidate-resumes")
      .upload(storagePath, file, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      setBusy(false);
      setMessage({ kind: "error", text: "Le CV n’a pas pu être téléversé. Réessayez." });
      return;
    }

    const { error: metadataError } = await supabase.from("resumes").insert({
      candidate_id: candidateId,
      title: file.name.slice(0, 160),
      storage_path: storagePath,
      mime_type: "application/pdf",
      size_bytes: file.size,
      is_default: !hasDefault,
    });

    if (metadataError) {
      const { error: cleanupError } = await supabase.storage
        .from("candidate-resumes")
        .remove([storagePath]);
      setBusy(false);
      setMessage({
        kind: "error",
        text: cleanupError
          ? "Le fichier a été envoyé, mais sa fiche n’a pas été créée. Contactez l’assistance."
          : "La fiche du CV n’a pas pu être créée. Vérifiez que vous n’avez pas déjà ce fichier.",
      });
      return;
    }

    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
    setMessage({ kind: "success", text: "Votre CV a été ajouté." });
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/10">
        <FileUp aria-hidden="true" className="mb-3 h-8 w-8 text-primary" />
        <span className="font-semibold">Choisir un fichier CV</span>
        <span className="mt-1 text-sm text-muted-foreground">PDF · 10 Mo maximum</span>
        <input
          accept=".pdf,application/pdf"
          className="sr-only"
          ref={inputRef}
          type="file"
        />
      </label>
      {message && <Alert variant={message.kind === "error" ? "destructive" : "success"}>{message.text}</Alert>}
      <Button disabled={busy} type="submit">
        {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <FileUp aria-hidden="true" className="h-4 w-4" />}
        {busy ? "Téléversement…" : "Ajouter le CV"}
      </Button>
    </form>
  );
}
