"use client"

import { useState, useEffect } from "react"
import type { Supplier, InventoryItem } from "@/types"
import { getInventoryItems } from "@/lib/api"
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
  costPrice: number
  discount: number
  status: string
}

interface SupplierDetailDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierDetailDialog({ supplier, open, onOpenChange }: SupplierDetailDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [inventoryLoading, setInventoryLoading] = useState(false)

  useEffect(() => {
    if (supplier && open) {
      fetchSupplierProducts()
      fetchInventoryItems()
    }
  }, [supplier, open])

  const fetchInventoryItems = async () => {
    setInventoryLoading(true)
    try {
      const items = await getInventoryItems()
      setInventoryItems(items)
    } catch (error) {
      console.error("Error fetching inventory items:", error)
    } finally {
      setInventoryLoading(false)
    }
  }

  const fetchSupplierProducts = async () => {
    if (!supplier) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/products/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const allProducts = await response.json()
        
        // Create a map for inventory items for quick lookup by product name
        const inventoryMap = new Map<string, InventoryItem>();
        inventoryItems.forEach(item => {
          inventoryMap.set(item.name.toLowerCase(), item);
        });

        const supplierProducts = allProducts
          .filter((product: any) => product.source?.toString() === supplier.id)
          .map((product: any) => {
            let costPrice = parseFloat(product.costPrice);
            let discount = parseFloat(product.discount);

            // Fallback to inventory costPrice if supplier product costPrice is invalid
            if (isNaN(costPrice) || costPrice === 0) { // Check for NaN or 0
              const matchingInventoryItem = inventoryMap.get(product.productName.toLowerCase());
              if (matchingInventoryItem && matchingInventoryItem.costPrice !== undefined) {
                costPrice = matchingInventoryItem.costPrice;
              }
            }

            return {
              ...product,
              costPrice: costPrice,
              discount: discount,
              status: product.status,
            };
          });
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
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[95vh] overflow-y-auto">
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
                        {isNaN(product.costPrice) ? "N/A" : `$${product.costPrice.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.discount > 0 ? (
                          <Badge variant="outline" className="bg-red-100 text-red-700">
                            {product.discount}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "Active"
                              ? "default"
                              : product.status === "Inactive"
                              ? "outline"
                              : (product.status === "Discount" || product.status === "Discontinued")
                              ? "secondary"
                              : "destructive"
                          }
                          className={`${
                            product.status === "Active"
                              ? "bg-green-600"
                              : product.status === "Inactive"
                              ? "bg-yellow-500"
                              : (product.status === "Discount" || product.status === "Discontinued")
                              ? "bg-red-600 text-white"
                              : "bg-red-600"
                          }`}
                        >
                          {(product.status === "Discontinued") ? "Discount" : product.status}
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
