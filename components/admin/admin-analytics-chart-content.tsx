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

type ChartMetricRow = {
  label: string;
  current: number;
  previous: number;
};

type PipelineMetricRow = {
  label: string;
  monthly: number;
  pending: number;
};

function formatCompactValue(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function AdminAnalyticsPerformanceChartContent({
  performanceChartConfig,
  comparisonChartData,
  numberLocale,
}: {
  performanceChartConfig: ChartConfig;
  comparisonChartData: ChartMetricRow[];
  numberLocale: string;
}) {
  return (
    <ChartContainer
      config={performanceChartConfig}
      className="h-[300px] w-full"
    >
      <LineChart
        accessibilityLayer
        data={comparisonChartData}
        margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => formatCompactValue(Number(value), numberLocale)}
        />
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

export function AdminAnalyticsDistributionChartContent({
  pipelineChartConfig,
  pipelineChartData,
  numberLocale,
}: {
  pipelineChartConfig: ChartConfig;
  pipelineChartData: PipelineMetricRow[];
  numberLocale: string;
}) {
  return (
    <ChartContainer config={pipelineChartConfig} className="h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={pipelineChartData}
        margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
        barGap={10}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => formatCompactValue(Number(value), numberLocale)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="monthly"
          fill="var(--color-monthly)"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="pending"
          fill="var(--color-pending)"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
