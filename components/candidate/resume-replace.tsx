"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const maxFileSize = 10 * 1024 * 1024;

export function ResumeReplace({
  candidateId,
  resumeId,
  oldStoragePath,
}: {
  candidateId: string;
  resumeId: string;
  oldStoragePath: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "warning"; text: string } | null>(null);

  async function replaceFile(file: File | undefined) {
    setMessage(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setMessage({ kind: "error", text: "Le nouveau CV doit être au format PDF." });
      return;
    }
    if (!file.size || file.size > maxFileSize || await file.slice(0, 5).text() !== "%PDF-") {
      setMessage({ kind: "error", text: "Le PDF est invalide ou dépasse la limite de 10 Mo." });
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData.user?.id !== candidateId) {
      setBusy(false);
      setMessage({ kind: "error", text: "Votre session a expiré. Reconnectez-vous puis réessayez." });
      return;
    }

    const safeName = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
    const newPath = `${candidateId}/${crypto.randomUUID()}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("candidate-resumes")
      .upload(newPath, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      setBusy(false);
      setMessage({ kind: "error", text: "Le nouveau CV n’a pas pu être téléversé." });
      return;
    }

    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        title: file.name.slice(0, 160),
        storage_path: newPath,
        mime_type: "application/pdf",
        size_bytes: file.size,
      })
      .eq("id", resumeId)
      .eq("candidate_id", candidateId);
    if (updateError) {
      const { error: cleanupError } = await supabase.storage.from("candidate-resumes").remove([newPath]);
      setBusy(false);
      setMessage({
        kind: "error",
        text: cleanupError
          ? "Le fichier est envoyé, mais son remplacement a échoué et le fichier temporaire n’a pas été supprimé."
          : "Le CV n’a pas pu être remplacé. L’ancien document est toujours disponible.",
      });
      return;
    }

    const { error: removeError } = await supabase.storage.from("candidate-resumes").remove([oldStoragePath]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (removeError) {
      console.error("Unable to remove the replaced resume file:", removeError);
      setMessage({ kind: "warning", text: "Le CV a été remplacé, mais l’ancien fichier n’a pas pu être supprimé." });
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(event) => void replaceFile(event.currentTarget.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <Button disabled={busy} onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
        {busy
          ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          : <FileUp aria-hidden="true" className="h-4 w-4" />}
        {busy ? "Remplacement…" : "Remplacer"}
      </Button>
      {message && <Alert variant={message.kind === "error" ? "destructive" : "warning"}>{message.text}</Alert>}
    </div>
  );
}
