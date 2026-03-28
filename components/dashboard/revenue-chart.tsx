"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RevenueChartProps {
  data: { date: string; revenue: number; invoices: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Daily revenue and invoice count</CardDescription>
      </CardHeader>
      <CardContent className="w-full overflow-hidden p-0">
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No revenue data available
          </div>
        ) : (
          <div className="w-full h-full min-h-[250px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[500px]">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(217, 91%, 60%)",
                },
              }}
              className="w-full h-full [&_.recharts-wrapper]:w-full [&_.recharts-wrapper]:h-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                    axisLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                    tickMargin={8}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                    axisLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                    tickFormatter={(value) => `$${value}`}
                    tickMargin={8}
                    width={60}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{
                      stroke: "hsl(217, 91%, 60%)",
                      strokeWidth: 1.5,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(217, 91%, 60%)"
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: "white",
                      stroke: "hsl(217, 91%, 60%)",
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      fill: "hsl(217, 91%, 60%)",
                      stroke: "white",
                    }}
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
