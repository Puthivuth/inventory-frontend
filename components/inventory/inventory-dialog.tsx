"use client"

import type { InventoryItem } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from 'lucide-react'
import { InventoryForm } from "./inventory-form"
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/api"

interface InventoryDialogProps {
  item?: InventoryItem | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess: () => void
}

export function InventoryDialog({ item, open, onOpenChange, onSuccess }: InventoryDialogProps) {
  const handleSubmit = async (data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (item) {
      await updateInventoryItem(item.id, data)
    } else {
      await addInventoryItem(data)
    }
    onSuccess()
  }

  const handleCancel = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    
    if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      await deleteInventoryItem(item.id)
      onSuccess()
      if (onOpenChange) {
        onOpenChange(false)
      }
    }
  }

  return (
    <>
      <style>{`
        [data-slot="dialog-close"] {
          display: none !important;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {!item && (
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
        )}
        <DialogContent 
          className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" 
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside
            if (!item) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (!item) e.preventDefault()
          }}
        >
          {!item && (
            <div className="mb-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="h-8 px-2 text-sm gap-2" 
                onClick={handleCancel}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          )}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {item ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {item ? "Update the inventory item details below." : "Fill in the details to add a new item to inventory."}
            </DialogDescription>
          </DialogHeader>
          <InventoryForm 
            item={item} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
            onDelete={item ? handleDelete : undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
