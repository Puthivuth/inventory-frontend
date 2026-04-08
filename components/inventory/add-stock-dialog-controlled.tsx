"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryItem } from "@/types";
import {
  updateInventoryItem,
  createNewStockRecord,
  getCurrentUser,
} from "@/lib/api";
import { isManagerOrAdmin } from "@/lib/permissions";

interface AddStockDialogControlledProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddStockDialogControlled({
  item,
  open,
  onOpenChange,
  onSuccess,
}: AddStockDialogControlledProps) {
  const [quantity, setQuantity] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCostPrice, setShowCostPrice] = useState(false);

  useEffect(() => {
    setShowCostPrice(isManagerOrAdmin());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    const addQty = parseInt(quantity);
    if (isNaN(addQty) || addQty <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }

    // Validate cost price if user is manager/admin
    let costPriceValue = item.costPrice || 0;
    if (showCostPrice && newCostPrice) {
      const parsedCost = parseFloat(newCostPrice);
      if (isNaN(parsedCost) || parsedCost < 0) {
        alert("Please enter a valid cost price");
        return;
      }

      // Calculate weighted average cost price (FIFO alternative)
      const oldStock = item.stock;
      const oldCost = item.costPrice || 0;
      const newStock = oldStock + addQty;

      // Weighted average: (old_qty × old_cost + new_qty × new_cost) / total_qty
      costPriceValue = (oldStock * oldCost + addQty * parsedCost) / newStock;
    }

    setIsLoading(true);
    try {
      const user = getCurrentUser();

      // Create NewStock record which will update inventory quantity via backend
      try {
        await createNewStockRecord({
          inventory: parseInt(item.id),
          quantity: addQty,
          purchasePrice:
            showCostPrice && newCostPrice
              ? parseFloat(newCostPrice)
              : item.costPrice || 0,
          receivedDate: new Date().toISOString().split("T")[0],
          supplier: item.sourceId ? parseInt(item.sourceId) : null,
          note:
            showCostPrice && newCostPrice
              ? `Stock added via inventory management. New weighted average: $${costPriceValue.toFixed(2)}`
              : `Stock added via inventory management by ${user?.username || "user"}`,
        });

        // Update cost price separately if it changed (don't update stock quantity again!)
        if (showCostPrice && newCostPrice) {
          try {
            await updateInventoryItem(item.id, {
              costPrice: costPriceValue,
            });
          } catch (costError) {
            console.error("Error updating cost price:", costError);
            // Cost price update failure is not critical
          }
        }

        onOpenChange(false);
        setQuantity("");
        setNewCostPrice("");
        onSuccess();
      } catch (stockError) {
        console.error("Error adding stock:", stockError);
        alert(
          "Error adding stock: " +
            (stockError instanceof Error
              ? stockError.message
              : "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error in add stock flow:", error);
      alert("Error adding stock");
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-blue-200">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-blue-700">Add Stock</DialogTitle>
            <DialogDescription>
              Add stock quantity for <strong>{item.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-stock">Current Stock</Label>
              <Input
                id="current-stock"
                value={item.stock}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Add Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity to add"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                required
              />
            </div>

            {showCostPrice && (
              <div className="grid gap-2">
                <Label htmlFor="cost-price">New Cost Price (Optional)</Label>
                <Input
                  id="cost-price"
                  type="number"
                  placeholder="Enter cost price for this batch"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  If provided, cost price will be updated using weighted average
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
