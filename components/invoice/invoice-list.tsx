"use client"

import { useState } from "react"
import type { Invoice } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Search, QrCode } from "lucide-react"
import { deleteInvoice } from "@/lib/api"
import { InvoicePreview } from "./invoice-preview"
import { KHQRPaymentDialog } from "./khqr-payment-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { canWrite } from "@/lib/permissions"

interface InvoiceListProps {
  invoices: Invoice[]
  onUpdate: () => void
}

export function InvoiceList({ invoices, onUpdate }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isKHQRDialogOpen, setIsKHQRDialogOpen] = useState(false)
  const [khqrInvoice, setKhqrInvoice] = useState<Invoice | null>(null)

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(id)
        onUpdate()
      } catch (error) {
        console.error("Error deleting invoice:", error)
        alert("Failed to delete invoice. Please try again.")
      }
    }
  }

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsPreviewOpen(true)
  }

  const handleKHQRPayment = (invoice: Invoice) => {
    setKhqrInvoice(invoice)
    setIsKHQRDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    // Reload invoices after successful payment
    onUpdate()
  }

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-600"
      case "draft":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-blue-600"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm min-w-[120px]">Invoice #</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">Customer</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">Date</TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[100px]">Total</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">Payment</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[90px]">Status</TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-sm text-muted-foreground">{invoice.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium">${invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.paymentMethod || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleKHQRPayment(invoice)}
                          title="Pay with KHQR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleView(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canWrite() && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoice && <InvoicePreview invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>

      {khqrInvoice && (
        <KHQRPaymentDialog
          open={isKHQRDialogOpen}
          onOpenChange={setIsKHQRDialogOpen}
          invoice={khqrInvoice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}