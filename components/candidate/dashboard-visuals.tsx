"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ApplicationTrendPoint = {
  month: string;
  count: number;
};

export type ApplicationStatusPoint = {
  label: string;
  count: number;
  color: string;
};

export function DashboardReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function CandidateDashboardCharts({
  trend,
  statuses,
  applicationCount,
}: {
  trend: ApplicationTrendPoint[];
  statuses: ApplicationStatusPoint[];
  applicationCount: number;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Activité de candidature</CardTitle>
          <CardDescription>Vos candidatures envoyées au cours des six derniers mois.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart accessibilityLayer data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                  }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="count" fill="#2563eb" maxBarSize={42} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {applicationCount === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Envoyez votre première candidature pour commencer votre suivi.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des candidatures</CardTitle>
          <CardDescription>Suivez les différentes étapes de votre recherche.</CardDescription>
        </CardHeader>
        <CardContent>
          {statuses.length ? (
            <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
              <div className="h-[210px] w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart accessibilityLayer>
                    <Pie
                      data={statuses}
                      dataKey="count"
                      innerRadius={58}
                      nameKey="label"
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="hsl(var(--card))"
                      strokeWidth={3}
                    >
                      {statuses.map((status) => (
                        <Cell fill={status.color} key={status.label} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="grid gap-3">
                {statuses.map((status) => (
                  <li className="flex items-center justify-between gap-3 text-sm" key={status.label}>
                    <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="truncate">{status.label}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{status.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex h-[210px] items-center justify-center rounded-lg border border-dashed border-border px-5 text-center text-sm text-muted-foreground">
              Le graphique apparaîtra après votre première candidature.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
