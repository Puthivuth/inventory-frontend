"use client"

import { useState } from "react"
import type { Supplier } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Mail, Phone, Pencil } from "lucide-react"
import { SupplierDialog } from "./supplier-dialog"
import { SupplierDetailDialog } from "./supplier-detail-dialog"
import { deleteSupplier } from "@/lib/api"
import { canWrite } from "@/lib/permissions"

interface SupplierTableProps {
  suppliers: Supplier[]
  onUpdate: () => void
}

export function SupplierTable({ suppliers, onUpdate }: SupplierTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      await deleteSupplier(id)
      onUpdate()
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingSupplier(null)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact person, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {canWrite() && (
          <SupplierDialog
            supplier={editingSupplier}
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) setEditingSupplier(null)
            }}
            onSuccess={() => {
              onUpdate()
              handleDialogClose()
            }}
          />
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">Supplier Name</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">Contact Person</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[180px]">Contact Info</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[200px]">Address</TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[140px]">Last Transaction</TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow 
                  key={supplier.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setViewingSupplier(supplier)
                    setIsDetailDialogOpen(true)
                  }}
                >
                  <TableCell className="py-2">
                    <div className="font-medium text-base">{supplier.name}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="text-base">{supplier.contactPerson || "-"}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {!supplier.email && !supplier.phone && <span className="text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="text-sm max-w-xs truncate">{supplier.address || "-"}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-sm">
                      {formatDate(supplier.lastTransactionDate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {canWrite() && (
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleEdit(supplier)}
                          title="Edit Supplier"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Supplier Detail Dialog */}
      <SupplierDetailDialog
        supplier={viewingSupplier}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  )
}
