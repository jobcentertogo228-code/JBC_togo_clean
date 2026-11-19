import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CandidateLoading() {
  return (
    <div aria-label="Chargement de votre espace candidat" className="space-y-6">
      <Skeleton className="h-52 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton className="h-32 rounded-xl" key={index} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-6">
          {[0, 1].map((item) => (
            <Card key={item}>
              <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
