"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyDashboardChart({
  data,
}: {
  data: Array<{ month: string; applications: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité de recrutement</CardTitle>
        <CardDescription>Candidatures reçues au cours des six derniers mois.</CardDescription>
      </CardHeader>
      <CardContent>
        <div aria-label="Graphique des candidatures reçues par mois" className="h-[270px] w-full" role="img">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart accessibilityLayer data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="applications" fill="#2563eb" maxBarSize={48} name="Candidatures" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {data.every((item) => item.applications === 0) && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Les candidatures reçues apparaîtront ici.</p>
        )}
      </CardContent>
    </Card>
  );
}
