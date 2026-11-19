"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CandidateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[candidate/error] Unhandled route error", error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <span className="rounded-full bg-warning p-3 text-warning-foreground">
          <AlertTriangle aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">Votre espace n’a pas pu être chargé</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Une erreur est survenue pendant le chargement de vos données. Réessayez dans quelques instants.
        </p>
        <Button className="mt-5" onClick={reset}>
          <RefreshCw aria-hidden="true" className="h-4 w-4" />Réessayer
        </Button>
      </CardContent>
    </Card>
  );
}
