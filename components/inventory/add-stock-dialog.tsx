"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { InventoryItem } from "@/types"
import { updateInventoryItem, createNewStockRecord, getCurrentUser } from "@/lib/api"
import { isManagerOrAdmin } from "@/lib/permissions"

interface AddStockDialogProps {
  item: InventoryItem
  onSuccess: () => void
}

export function AddStockDialog({ item, onSuccess }: AddStockDialogProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState("")
  const [newCostPrice, setNewCostPrice] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCostPrice, setShowCostPrice] = useState(false)

  useEffect(() => {
    setShowCostPrice(isManagerOrAdmin())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const addQty = parseInt(quantity)
    if (isNaN(addQty) || addQty <= 0) {
      alert("Please enter a valid quantity greater than 0")
      return
    }

    // Validate cost price if user is manager/admin
    let costPriceValue = item.costPrice || 0
    if (showCostPrice && newCostPrice) {
      const parsedCost = parseFloat(newCostPrice)
      if (isNaN(parsedCost) || parsedCost < 0) {
        alert("Please enter a valid cost price")
        return
      }
      
      // Calculate weighted average cost price (FIFO alternative)
      const oldStock = item.stock
      const oldCost = item.costPrice || 0
      const newStock = oldStock + addQty
      
      // Weighted average: (old_qty × old_cost + new_qty × new_cost) / total_qty
      costPriceValue = ((oldStock * oldCost) + (addQty * parsedCost)) / newStock
    }

    setIsLoading(true)
    try {
      const updateData: any = { 
        stock: item.stock + addQty
      }
      
      // Only update cost price if user has permission and provided new cost
      if (showCostPrice && newCostPrice) {
        updateData.costPrice = costPriceValue
      }
      
      const result = await updateInventoryItem(item.id, updateData)
      
      if (result) {
        // Create NewStock record if cost price was provided
        if (showCostPrice && newCostPrice) {
          try {
            const user = getCurrentUser()
            await createNewStockRecord({
              inventory: parseInt(item.id),
              quantity: addQty,
              purchasePrice: parseFloat(newCostPrice),
              receivedDate: new Date().toISOString().split('T')[0],
              supplier: item.sourceId ? parseInt(item.sourceId) : null,
              note: `Stock added via inventory management. New weighted average: $${costPriceValue.toFixed(2)}`
            })
          } catch (stockError) {
            console.error("Error creating stock record:", stockError)
            // Don't fail the entire operation if stock record creation fails
          }
        }
        
        setOpen(false)
        setQuantity("")
        setNewCostPrice("")
        onSuccess()
      } else {
        alert("Failed to add stock")
      }
    } catch (error) {
      console.error("Error adding stock:", error)
      alert("Error adding stock")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
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
              <Label htmlFor="add-quantity">Quantity to Add *</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                autoFocus
              />
            </div>
            {showCostPrice && (
              <div className="grid gap-2">
                <Label htmlFor="new-cost-price">
                  New Cost Price ($) - Per Unit
                  <span className="text-xs text-muted-foreground ml-2">
                    (Current: ${item.costPrice?.toFixed(2) || '0.00'})
                  </span>
                </Label>
                <Input
                  id="new-cost-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter cost price for this batch"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                />
                {newCostPrice && quantity && parseInt(quantity) > 0 && parseFloat(newCostPrice) >= 0 && (
                  <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    <strong>Weighted Average Cost:</strong> $
                    {(
                      ((item.stock * (item.costPrice || 0)) + (parseInt(quantity) * parseFloat(newCostPrice))) /
                      (item.stock + parseInt(quantity))
                    ).toFixed(2)}
                  </div>
                )}
              </div>
            )}
            {quantity && parseInt(quantity) > 0 && (
              <div className="grid gap-2">
                <Label>New Stock Level</Label>
                <div className="text-2xl font-bold text-green-600">
                  {item.stock + parseInt(quantity)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
