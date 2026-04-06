"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ArrowLeft } from "lucide-react";

interface CategoryData {
  name: string;
  value: number;
}

interface SalesItem {
  itemId: string;
  itemName: string;
  totalQuantity: number;
  totalRevenue: number;
  invoiceCount: number;
  category?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  subcategory: string;
  stock: number;
  salePrice: number;
}

interface CategoryDistributionProps {
  data: CategoryData[];
  salesData?: SalesItem[];
  inventoryData?: InventoryItem[];
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#6366f1",
];

export function CategoryDistribution({
  data,
  salesData,
  inventoryData,
}: CategoryDistributionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subcategory Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No subcategory data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare pie chart data
  const pieData = data.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  // Get products for selected subcategory
  const productsInCategory = selectedCategory
    ? inventoryData
        ?.filter((item) => item.subcategory === selectedCategory)
        .map((inv) => {
          // Combine inventory data with sales data
          const salesInfo = salesData?.find((s) => s.itemId === inv.id);
          return {
            itemId: inv.id,
            itemName: inv.name,
            totalQuantity: salesInfo?.totalQuantity || 0,
            totalRevenue: salesInfo?.totalRevenue || 0,
            invoiceCount: salesInfo?.invoiceCount || 0,
            category: selectedCategory,
            stock: inv.stock,
            salePrice: inv.salePrice,
          };
        }) || []
    : [];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subcategory Distribution</CardTitle>
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {selectedCategory ? (
          // Drill-down view: Side-by-side layout
          <div className="flex gap-8">
            {/* Left side: Pie chart */}
            <div className="w-1/2 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: selectedCategory,
                        value: productsInCategory.length,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value} products`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value} products`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right side: Products list */}
            <div className="w-1/2 overflow-hidden flex flex-col">
              <p className="font-semibold text-sm mb-3">
                Products in{" "}
                <span className="text-blue-600">{selectedCategory}</span>
              </p>
              {productsInCategory.length > 0 ? (
                <div className="space-y-2 overflow-y-auto max-h-80">
                  {productsInCategory.map((product, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {product.itemName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {product.totalQuantity} | $
                          {product.totalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="ml-2 whitespace-nowrap text-xs">
                        {product.invoiceCount} orders
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No products found in this subcategory
                </p>
              )}
            </div>
          </div>
        ) : (
          // Pie chart view - Side by side layout
          <div className="flex gap-8 items-start">
            {/* Left: Pie chart */}
            <div className="w-1/2 flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(entry: any) => setSelectedCategory(entry.name)}>
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `${value} products`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right: Subcategory listings */}
            <div className="w-1/2 space-y-3">
              <p className="text-xs text-muted-foreground mb-4">
                Click on any category to view its products
              </p>
              <div className="space-y-2">
                {data.map((category, index) => {
                  const percentage = (category.value / total) * 100;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(category.name)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left border">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium text-sm">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {category.value} products
                        </Badge>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
