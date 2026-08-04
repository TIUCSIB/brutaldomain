"use client";

import * as React from "react";
import { Bar, BarChart, Label, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/** Pattern from neobrutalism chart-bar-mixed */
export function StatusBarChart({
  data,
}: {
  data: { key: string; label: string; count: number }[];
}) {
  const chartConfig = {
    count: { label: "数量" },
    ...Object.fromEntries(
      data.map((item, index) => [
        item.key,
        {
          label: item.label,
          color: `var(--chart-${(index % 5) + 1})`,
        },
      ]),
    ),
  } satisfies ChartConfig;

  const chartData = data.map((item) => ({
    key: item.key,
    count: item.count,
    fill: `var(--color-${item.key})`,
  }));

  return (
    <Card className="gap-3 bg-secondary-background py-4 text-foreground">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">域名状态</CardTitle>
        <CardDescription className="text-xs">按注册状态统计</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2 sm:px-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
          >
            <YAxis
              dataKey="key"
              type="category"
              tickLine={false}
              tickMargin={8}
              width={56}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label as string
              }
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** Pattern from neobrutalism chart-pie-donut-text */
export function RiskDonutChart({
  data,
  total,
}: {
  data: { key: string; label: string; count: number }[];
  total: number;
}) {
  const chartConfig = {
    count: { label: "数量" },
    ...Object.fromEntries(
      data.map((item, index) => [
        item.key,
        {
          label: item.label,
          color: `var(--chart-${(index % 5) + 1})`,
        },
      ]),
    ),
  } satisfies ChartConfig;

  const chartData = data.map((item) => ({
    key: item.key,
    count: item.count,
    fill: `var(--color-${item.key})`,
  }));

  const centerTotal = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.count, 0),
    [chartData],
  );

  return (
    <Card className="flex flex-col gap-3 bg-secondary-background py-4 text-foreground">
      <CardHeader className="items-center px-4 pb-0">
        <CardTitle className="text-base">到期健康度</CardTitle>
        <CardDescription className="text-xs">风险结构一览 · 共 {total} 个</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-2 pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="key" />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="key"
              innerRadius={48}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {centerTotal.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-foreground text-xs"
                        >
                          域名
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** Pattern from neobrutalism chart-bar-horizontal */
export function ProviderBarChart({
  data,
}: {
  data: { provider: string; count: number }[];
}) {
  const chartConfig = {
    count: {
      label: "域名数",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const chartHeight = Math.max(120, data.length * 36);

  return (
    <Card className="gap-3 bg-secondary-background py-4 text-foreground">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">服务商分布</CardTitle>
        <CardDescription className="text-xs">
          {data.length} 个账户 · 按数量排序
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2 sm:px-4">
        {data.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-foreground/70">
            暂无服务商数据
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full"
            style={{ height: chartHeight }}
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{ left: -8, right: 8, top: 0, bottom: 0 }}
            >
              <XAxis type="number" dataKey="count" hide />
              <YAxis
                dataKey="provider"
                type="category"
                tickLine={false}
                tickMargin={8}
                width={36}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
