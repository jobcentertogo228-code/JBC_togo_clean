"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompanyJobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[company/offres/error] Unhandled route error", error);
  }, [error]);

  return (
    <main className="page-shell main-content">
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <span className="rounded-full bg-warning p-3 text-warning-foreground">
            <AlertTriangle aria-hidden="true" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Vos offres n’ont pas pu être chargées</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Réessayez ou revenez à votre espace entreprise.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />Réessayer
            </Button>
            <Button asChild variant="outline"><Link href="/company">Espace entreprise</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
