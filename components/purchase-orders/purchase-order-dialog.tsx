"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PurchaseOrderForm } from "./purchase-order-form"

interface Invoice {
  invoiceId: number
  customer: number | null
  customerName?: string
  createdByUser: number | null
  createdByUsername?: string
  totalBeforeDiscount: string
  discount: string
  tax: string
  grandTotal: string
  paymentMethod: string
  note: string | null
  status: string
  qrReference: string | null
  createdAt: string
  purchases?: Purchase[]
}

interface Purchase {
  purchaseId: number
  product: number | null
  productName?: string
  quantity: number
  pricePerUnit: string
  discount: string
  subtotal: string
}

interface PurchaseOrderDialogProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PurchaseOrderDialog({ invoice, open, onOpenChange, onSuccess }: PurchaseOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">
            {invoice ? "View Customer Order" : "Create Customer Order"}
          </DialogTitle>
        </DialogHeader>
        <PurchaseOrderForm 
          invoice={invoice} 
          onSuccess={onSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
