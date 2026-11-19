import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main aria-label="Chargement de JOB-CENTER" className="page-shell main-content">
      <div className="space-y-6" role="status">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only">Chargement en cours…</span>
      </div>
    </main>
  );
}
