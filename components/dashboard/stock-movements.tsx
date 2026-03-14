"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StockMovement {
  id: number;
  productName: string;
  type: "in" | "out";
  quantity: number;
  date: string;
}

export function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockMovements = async () => {
      try {
        // TODO: Replace with actual API call to get recent stock movements
        // For now, showing placeholder data
        const placeholderData: StockMovement[] = [
          {
            id: 1,
            productName: "Product A",
            type: "in",
            quantity: 50,
            date: new Date().toLocaleDateString(),
          },
          {
            id: 2,
            productName: "Product B",
            type: "out",
            quantity: 10,
            date: new Date().toLocaleDateString(),
          },
          {
            id: 3,
            productName: "Product C",
            type: "in",
            quantity: 25,
            date: new Date(Date.now() - 86400000).toLocaleDateString(),
          },
        ];
        setMovements(placeholderData);
      } catch (error) {
        console.error("Error fetching stock movements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockMovements();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Stock Movements</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading movements...</p>
        ) : movements.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent movements</p>
        ) : (
          <div className="space-y-3">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-lg ${
                      movement.type === "in" ? "bg-green-100" : "bg-red-100"
                    }`}>
                    {movement.type === "in" ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {movement.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movement.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={movement.type === "in" ? "default" : "outline"}
                    className={
                      movement.type === "in"
                        ? "bg-green-600"
                        : "bg-red-600 text-white"
                    }>
                    {movement.type === "in" ? "+" : "-"}
                    {movement.quantity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
