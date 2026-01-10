"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RevenueChartProps {
  data: { date: string; revenue: number; invoices: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Daily revenue and invoice count</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No revenue data available</div>
        ) : (
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue",
                color: "hsl(217, 91%, 60%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
