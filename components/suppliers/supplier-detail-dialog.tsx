"use client"

import { useState, useEffect } from "react"
import type { Supplier } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Mail, Phone, MapPin, Building } from "lucide-react"
import Image from "next/image"

interface Product {
  productId: number
  productName: string
  description: string
  image: string | null
  skuCode: string
  unit: string
  costPrice: string
  discount: string
  status: string
}

interface SupplierDetailDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierDetailDialog({ supplier, open, onOpenChange }: SupplierDetailDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (supplier && open) {
      fetchSupplierProducts()
    }
  }, [supplier, open])

  const fetchSupplierProducts = async () => {
    if (!supplier) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://vuthserver.tailf87741.ts.net/api/products/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const allProducts = await response.json()
        // Filter products by supplier source ID
        const supplierProducts = allProducts.filter(
          (product: Product & { source: number | null }) => product.source?.toString() === supplier.id
        )
        setProducts(supplierProducts)
      }
    } catch (error) {
      console.error("Error fetching supplier products:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!supplier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Building className="h-5 w-5" />
            {supplier.name}
          </DialogTitle>
          <DialogDescription>
            Supplier details and product list
          </DialogDescription>
        </DialogHeader>

        {/* Supplier Information */}
        <div className="space-y-4 border-b pb-4">
          <h3 className="font-semibold text-lg">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {supplier.contactPerson && (
              <div className="flex items-start gap-2">
                <Building className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{supplier.contactPerson}</p>
                </div>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{supplier.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({products.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found for this supplier
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="w-12 h-12 relative rounded overflow-hidden bg-muted">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.skuCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">
                        ${parseFloat(product.costPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(product.discount) > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {product.discount}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.status === "Active" ? "default" : "secondary"}
                          className={product.status === "Active" ? "bg-green-600" : ""}
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
