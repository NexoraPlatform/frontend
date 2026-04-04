"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type PerformanceDatum = {
  label: string;
  current: number;
  previous: number;
};

type ActivityMixDatum = {
  label: string;
  value: number;
};

export function DashboardPerformanceChartContent({
  chartConfig,
  performanceData,
}: {
  chartConfig: ChartConfig;
  performanceData: PerformanceDatum[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart
        accessibilityLayer
        data={performanceData}
        margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
        <YAxis tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="previous"
          stroke="var(--color-previous)"
          strokeWidth={2}
          dot={{ fill: "var(--color-previous)", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="current"
          stroke="var(--color-current)"
          strokeWidth={2}
          dot={{ fill: "var(--color-current)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function DashboardActivityMixChartContent({
  mixChartConfig,
  activityMixData,
}: {
  mixChartConfig: ChartConfig;
  activityMixData: ActivityMixDatum[];
}) {
  return (
    <ChartContainer config={mixChartConfig} className="h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={activityMixData}
        margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
        <YAxis tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
