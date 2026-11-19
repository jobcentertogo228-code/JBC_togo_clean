import type { Metadata } from "next";
import { Download, FileText, Star } from "lucide-react";
import { DefaultResumeForm } from "@/components/candidate/default-resume-form";
import { ResumeDeleteForm } from "@/components/candidate/resume-delete-form";
import { ResumeReplace } from "@/components/candidate/resume-replace";
import { ResumeUpload } from "@/components/candidate/resume-upload";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { formatDate } from "@/lib/candidate/queries";

export const metadata: Metadata = { title: "Mes CV" };

export default async function CandidateResumesPage() {
  const { supabase, user } = await requireRole("candidate");
  const { data: resumes, error } = await supabase
    .from("resumes")
    .select("id, title, storage_path, mime_type, size_bytes, is_default, created_at, updated_at")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[candidate/cv] Supabase query failed", {
      userId: user.id,
      role: "candidate",
      query: "resumes",
      error: { code: error.code, message: error.message, details: error.details, hint: error.hint },
    });
  }

  const resumeCards = await Promise.all((resumes ?? []).map(async (resume) => {
    const { data, error: signedUrlError } = await supabase.storage
      .from("candidate-resumes")
      .createSignedUrl(resume.storage_path, 300);
    if (signedUrlError) {
      console.error("[candidate/cv] Unable to create resume download link", {
        userId: user.id,
        role: "candidate",
        resumeId: resume.id,
        error: {
          statusCode: signedUrlError.statusCode,
          message: signedUrlError.message,
        },
      });
    }
    return { ...resume, signedUrl: data?.signedUrl ?? null };
  }));
  const hasDefault = (resumes ?? []).some((resume) => resume.is_default);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Mon espace candidat</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Mes CV</h1>
        <p className="mt-2 text-muted-foreground">Gérez les documents que vous joignez à vos candidatures.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un CV</CardTitle>
          <CardDescription>Votre document est conservé dans un espace privé et accessible uniquement selon les règles de la plateforme.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUpload candidateId={user.id} hasDefault={hasDefault} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents enregistrés</CardTitle>
          <CardDescription>
            {error
              ? "La liste de vos CV n’a pas pu être chargée."
              : `${resumeCards.length} CV${resumeCards.length > 1 ? " enregistrés" : " enregistré"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="warning">La liste de vos CV est indisponible pour le moment. Vous pouvez tout de même en ajouter un nouveau.</Alert>
          ) : resumeCards.length ? (
            <div className="divide-y divide-border">
              {resumeCards.map((resume) => (
                <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0" key={resume.id}>
                  <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><FileText aria-hidden="true" className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{resume.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(resume.size_bytes / 1024 / 1024).toFixed(1)} Mo · Ajouté le {formatDate(resume.created_at)}
                      {resume.updated_at > resume.created_at ? ` · Remplacé le ${formatDate(resume.updated_at)}` : ""}
                    </p>
                  </div>
                  {resume.is_default && <Badge className="hidden sm:inline-flex" variant="success"><Star className="mr-1 h-3 w-3" />CV principal</Badge>}
                  {!resume.is_default && <DefaultResumeForm resumeId={resume.id} />}
                  <ResumeReplace candidateId={user.id} oldStoragePath={resume.storage_path} resumeId={resume.id} />
                  {resume.signedUrl ? (
                    <a
                      aria-label={`Télécharger ${resume.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-primary"
                      href={resume.signedUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-warning-foreground">Téléchargement indisponible</span>
                  )}
                  <ResumeDeleteForm resumeId={resume.id} />
                  {resume.signedUrl && resume.mime_type === "application/pdf" && (
                    <details className="basis-full rounded-lg border border-border p-3">
                      <summary className="cursor-pointer text-sm font-medium">Prévisualiser le PDF</summary>
                      <object
                        aria-label={`Aperçu de ${resume.title}`}
                        className="mt-3 h-[min(70vh,700px)] w-full rounded-md border border-border"
                        data={resume.signedUrl}
                        type="application/pdf"
                      >
                        <p className="p-3 text-sm text-muted-foreground">
                          L’aperçu n’est pas disponible dans ce navigateur. Utilisez le lien de téléchargement.
                        </p>
                      </object>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="info">Vous n’avez pas encore ajouté de CV. Ajoutez-en un pour faciliter vos prochaines candidatures.</Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
