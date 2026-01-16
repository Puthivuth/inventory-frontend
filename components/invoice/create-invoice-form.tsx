"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { InventoryItem, InvoiceItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus } from "lucide-react"
import { getInventoryItems } from "@/lib/api"

interface CreateInvoiceFormProps {
  onSubmit: (data: {
    customerName: string
    customerEmail: string
    customerPhone: string
    items: InvoiceItem[]
    subtotal: number
    tax: number
    discount: number
    total: number
    status: "draft" | "paid" | "pending"
    paymentMethod: string
  }) => void
}

export function CreateInvoiceForm({ onSubmit }: CreateInvoiceFormProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([])
  const [taxRate, setTaxRate] = useState(10) // 10% tax
  const [additionalDiscount, setAdditionalDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  useEffect(() => {
    const loadInventoryItems = async () => {
      try {
        setIsLoading(true)
        const items = await getInventoryItems()
        setInventoryItems(items)
      } catch (error) {
        console.error("Error loading inventory items:", error)
        alert("Failed to load inventory items. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    loadInventoryItems()
  }, [])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      inventoryItemId: "",
      name: "",
      sku: "",
      quantity: 1,
      price: 0,
      discount: 0,
      total: 0,
    }
    setSelectedItems([...selectedItems, newItem])
  }

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }

          if (field === "inventoryItemId") {
            const inventoryItem = inventoryItems.find((inv) => inv.id === value)
            if (inventoryItem) {
              updated.name = inventoryItem.name
              updated.sku = inventoryItem.sku
              updated.price = inventoryItem.price
              updated.discount = inventoryItem.discount ?? 0
            }
          }

          if (field === "quantity") {
            const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventoryItemId);
            if (inventoryItem && Number(value) > inventoryItem.stock) {
              alert(
                `Insufficient stock for ${inventoryItem.name}. Only ${inventoryItem.stock} units available.`
              );
              updated.quantity = inventoryItem.stock;
            }
          }

          // Calculate total for this item
          const itemPrice = updated.price
          const itemDiscount = (itemPrice * updated.discount) / 100
          const priceAfterDiscount = itemPrice - itemDiscount
          updated.total = priceAfterDiscount * updated.quantity

          return updated
        }
        return item
      }),
    )
  }

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0)
    const validDiscount = isNaN(additionalDiscount) ? 0 : additionalDiscount
    const discountAmount = (subtotal * validDiscount) / 100
    const subtotalAfterDiscount = subtotal - discountAmount
    const validTax = isNaN(taxRate) ? 0 : taxRate
    const taxAmount = (subtotalAfterDiscount * validTax) / 100
    const total = subtotalAfterDiscount + taxAmount

    return { subtotal, taxAmount, discountAmount, total }
  }

  const handleSubmit = (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      alert("Please add at least one item to the invoice")
      return
    }

    if (selectedItems.some((item) => !item.inventoryItemId)) {
      alert("Please select a product for all items")
      return
    }

    // Check stock availability
    for (const item of selectedItems) {
      const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventoryItemId)
      if (!inventoryItem || inventoryItem.stock < item.quantity) {
        alert(`Insufficient stock for ${item.name}. Available: ${inventoryItem?.stock || 0}`)
        return
      }
    }

    const { subtotal, taxAmount, discountAmount, total } = calculateTotals()

    // Determine status based on draft flag and payment method
    let status: "draft" | "paid" | "pending" = "draft"
    if (!isDraft) {
      status = paymentMethod === "KHQR" ? "pending" : "paid"
    }

    onSubmit({
      customerName,
      customerEmail,
      customerPhone,
      items: selectedItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status,
      paymentMethod,
    })
  }

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals()

  const activeInventoryItems = useMemo(() => {
    return inventoryItems.filter(item => item.status === "Active")
  }, [inventoryItems])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inventory items...</p>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice Items</CardTitle>
          <Button type="button" onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedItems.map((item, index) => (
            <Card key={item.id} className="border-2">
              <CardContent className="pt-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                    <Label>Product</Label>
                    <Select
                      value={item.inventoryItemId}
                      onValueChange={(value) => updateItem(item.id, "inventoryItemId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeInventoryItems.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name} - ${invItem.price.toFixed(2)} (Stock: {invItem.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input value={`$${item.price.toFixed(2)}`} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount</Label>
                    <Input value={`${item.discount}%`} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="flex gap-2">
                      <Input value={`$${item.total.toFixed(2)}`} disabled className="font-medium" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {selectedItems.length === 0 && (
            <div className="text-center text-muted-foreground py-8">No items added yet. Click "Add Item" to start.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="KHQR">KHQR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                value={taxRate === 0 ? "" : taxRate}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                  setTaxRate(Number.isNaN(value) ? 0 : value)
                }}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalDiscount">Additional Discount (%)</Label>
              <Input
                id="additionalDiscount"
                type="number"
                min="0"
                max="100"
                value={additionalDiscount === 0 ? "" : additionalDiscount}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                  setAdditionalDiscount(Number.isNaN(value) ? 0 : value)
                }}
                placeholder="0"
              />
            </div>
          </div>
          
          {paymentMethod === "KHQR" && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ℹ️ KHQR payment will generate a QR code for Bakong payment. Invoice status will be set to Pending until payment is confirmed.
              </p>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Discount ({isNaN(additionalDiscount) ? 0 : additionalDiscount}%):
              </span>
              <span className="font-medium text-red-600">-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({isNaN(taxRate) ? 0 : taxRate}%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, true)} className="w-full sm:w-auto">
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          {paymentMethod === "KHQR" ? "Create & Generate KHQR" : "Create Invoice"}
        </Button>
      </div>
    </form>
  )
}
