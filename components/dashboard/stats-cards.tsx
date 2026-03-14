"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  Layers,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryValue: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "bg-blue-600",
    },
    {
      title: "Total Stock",
      value: stats.totalStock.toString(),
      icon: Layers,
      color: "bg-green-600",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? "bg-yellow-600" : "bg-green-600",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      icon: AlertCircle,
      color: stats.outOfStockCount > 0 ? "bg-red-600" : "bg-green-600",
    },
    {
      title: "Inventory Value",
      value: `$${stats.inventoryValue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`${card.color} p-1.5 sm:p-2 rounded-lg`}>
              <card.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
