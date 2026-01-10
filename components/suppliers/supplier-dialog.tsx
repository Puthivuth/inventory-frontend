"use client"

import type { Supplier } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SupplierForm } from "./supplier-form"
import { addSupplier, updateSupplier } from "@/lib/api"

interface SupplierDialogProps {
  supplier?: Supplier | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess: () => void
}

export function SupplierDialog({ supplier, open, onOpenChange, onSuccess }: SupplierDialogProps) {
  const handleSubmit = async (
    data: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "userId" | "lastTransactionDate">,
  ) => {
    if (supplier) {
      await updateSupplier(supplier.id, data)
    } else {
      await addSupplier(data)
    }
    onSuccess()
  }

  const handleCancel = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!supplier && (
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 text-sm sm:text-base">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription className="text-sm">
            {supplier
              ? "Update the supplier details below."
              : "Fill in the details to add a new supplier to your system."}
          </DialogDescription>
        </DialogHeader>
        <SupplierForm supplier={supplier} onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  )
}
