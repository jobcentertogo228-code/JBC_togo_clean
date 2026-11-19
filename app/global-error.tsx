"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root application error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main className="page-shell main-content">
          <section className="auth-card text-center">
            <span className="mx-auto inline-flex rounded-full bg-warning p-3 text-warning-foreground">
              <AlertTriangle aria-hidden="true" className="h-6 w-6" />
            </span>
            <h1>JOB-CENTER est momentanément indisponible</h1>
            <p className="muted">Une erreur est survenue. Réessayez dans quelques instants.</p>
            <Button className="mt-5" onClick={reset}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />Réessayer
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
