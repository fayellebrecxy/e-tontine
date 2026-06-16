"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GroupDatum = {
  name: string;
  membres: number;
  cycles: number;
  reunions: number;
};

export type ChartsLabels = {
  activityTitle: string;
  compositionTitle: string;
  members: string;
  cycles: string;
  meetings: string;
  rubriques: string;
  empty: string;
};

type Props = {
  groups: GroupDatum[];
  composition: { cycles: number; reunions: number; rubriques: number };
  labels: ChartsLabels;
};

const SERIES_COLORS = {
  membres: "#006b2c",
  cycles: "#1f9d52",
  reunions: "#7fd99b",
};

const DONUT_COLORS = ["#006b2c", "#1f9d52", "#7fd99b"];

function truncate(value: string, max = 10) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function DashboardCharts({ groups, composition, labels }: Props) {
  const hasGroups = groups.length > 0;
  const compositionData = [
    { name: labels.cycles, value: composition.cycles },
    { name: labels.meetings, value: composition.reunions },
    { name: labels.rubriques, value: composition.rubriques },
  ];
  const compositionTotal = compositionData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Bar chart : activité par groupe */}
      <section className="rounded-2xl border border-border-light bg-surface-container-lowest p-5 shadow-card lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-text-main">
            {labels.activityTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-3 font-sans text-xs text-text-muted">
            {[
              { label: labels.members, color: SERIES_COLORS.membres },
              { label: labels.cycles, color: SERIES_COLORS.cycles },
              { label: labels.meetings, color: SERIES_COLORS.reunions },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {hasGroups ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={groups} barGap={4} barCategoryGap="22%">
              <XAxis
                dataKey="name"
                tickFormatter={(v: string) => truncate(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--ds-text-muted))" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
                tick={{ fontSize: 12, fill: "hsl(var(--ds-text-muted))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--ds-primary) / 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--ds-border-light))",
                  background: "hsl(var(--ds-container-lowest))",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="membres" name={labels.members} fill={SERIES_COLORS.membres} radius={[6, 6, 0, 0]} />
              <Bar dataKey="cycles" name={labels.cycles} fill={SERIES_COLORS.cycles} radius={[6, 6, 0, 0]} />
              <Bar dataKey="reunions" name={labels.meetings} fill={SERIES_COLORS.reunions} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center font-sans text-sm text-text-muted">
            {labels.empty}
          </div>
        )}
      </section>

      {/* Donut : répartition globale */}
      <section className="rounded-2xl border border-border-light bg-surface-container-lowest p-5 shadow-card">
        <h2 className="mb-4 font-heading text-lg font-semibold text-text-main">
          {labels.compositionTitle}
        </h2>

        {compositionTotal > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={compositionData}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                stroke="none"
              >
                {compositionData.map((entry, i) => (
                  <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--ds-border-light))",
                  background: "hsl(var(--ds-container-lowest))",
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "hsl(var(--ds-text-muted))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center font-sans text-sm text-text-muted">
            {labels.empty}
          </div>
        )}
      </section>
    </div>
  );
}
