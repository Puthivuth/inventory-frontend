"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Invoice {
  invoiceId: number;
  customer: number | null;
  customerName?: string;
  customerPhone?: string;
  createdByUser: number | null;
  createdByUsername?: string;
  totalBeforeDiscount: string;
  discount: string;
  tax: string;
  grandTotal: string;
  paymentMethod: string;
  note: string | null;
  status: string;
  createdAt: string;
  purchases?: Purchase[];
}

interface Purchase {
  purchaseId: number;
  product: number | null;
  productName?: string;
  quantity: number;
  pricePerUnit: string;
  discount: string;
  subtotal: string;
}

interface Customer {
  customerId: number;
  name: string;
  customerType: string;
  phone: string | null;
  email: string | null;
  businessAddress: string | null;
}

interface Product {
  productId: number;
  productName: string;
  skuCode: string;
  costPrice: string;
  salePrice: string;
  discount: string;
  status: string;
}

interface Inventory {
  inventoryId: number;
  product: number;
  quantity: number;
  reorderLevel: number;
  location: string;
}

interface LineItem {
  product: number | null;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  discount: number;
}

interface PurchaseOrderFormProps {
  invoice: Invoice | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseOrderForm({
  invoice,
  onSuccess,
  onCancel,
}: PurchaseOrderFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(
    invoice?.customer || null,
  );
  const [paymentMethod, setPaymentMethod] = useState(
    invoice?.paymentMethod || "Cash",
  );
  const [status, setStatus] = useState(invoice?.status || "Pending");
  const [note, setNote] = useState(invoice?.note || "");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tax, setTax] = useState(parseFloat(invoice?.tax || "0"));
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerType, setNewCustomerType] = useState("Individual");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [stockWarningDialog, setStockWarningDialog] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<
    Array<{ productName: string; available: number; requested: number }>
  >([]);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [proceedWithLowStock, setProceedWithLowStock] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (invoice && customers.length > 0) {
      setCustomerId(invoice.customer);
      setPaymentMethod(invoice.paymentMethod);
      setStatus(invoice.status);
      setNote(invoice.note || "");
      setTax(parseFloat(invoice.tax || "0"));

      if (invoice.purchases) {
        const items: LineItem[] = invoice.purchases.map((p) => ({
          product: p.product,
          productName: p.productName || "",
          quantity: p.quantity,
          pricePerUnit: parseFloat(p.pricePerUnit),
          discount: parseFloat(p.discount),
        }));
        setLineItems(items);
      }
    }
  }, [invoice, customers]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Fetch customers
        const customersRes = await fetch(
          "http://localhost:8000/api/customers/",
          {
            headers: { Authorization: `Token ${token}` },
            signal: controller.signal,
          },
        );
        if (customersRes.ok) {
          setCustomers(await customersRes.json());
        }

        // Fetch products
        const productsRes = await fetch("http://localhost:8000/api/products/", {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        });
        if (productsRes.ok) {
          setProducts(await productsRes.json());
        }

        // Fetch inventory
        const inventoryRes = await fetch(
          "http://localhost:8000/api/inventory/",
          {
            headers: { Authorization: `Token ${token}` },
            signal: controller.signal,
          },
        );
        if (inventoryRes.ok) {
          setInventory(await inventoryRes.json());
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error(
          "Data loading timeout - request took longer than 30 seconds",
        );
      } else {
        console.error("Error loading data:", error);
      }
    }
  };

  const addItem = () => {
    setLineItems([
      ...lineItems,
      {
        product: null,
        productName: "",
        quantity: 1,
        pricePerUnit: 0,
        discount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const getAvailableStock = (productId: number): number => {
    const inventoryItem = inventory.find((inv) => inv.product === productId);
    return inventoryItem?.quantity || 0;
  };

  const checkStockAvailability = (): {
    hasWarnings: boolean;
    warnings: Array<{
      productName: string;
      available: number;
      requested: number;
    }>;
  } => {
    const warnings: Array<{
      productName: string;
      available: number;
      requested: number;
    }> = [];

    lineItems.forEach((item) => {
      if (item.product) {
        const availableStock = getAvailableStock(item.product);
        if (item.quantity > availableStock) {
          warnings.push({
            productName: item.productName,
            available: availableStock,
            requested: item.quantity,
          });
        }
      }
    });

    return {
      hasWarnings: warnings.length > 0,
      warnings,
    };
  };

  const getProductStock = (productId: number | null) => {
    if (!productId) return 0;
    return getAvailableStock(productId);
  };

  const updateItem = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    const newItems = [...lineItems];
    if (field === "product") {
      const product = products.find((p) => p.productId === Number(value));
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product: product.productId,
          productName: product.productName,
          pricePerUnit: parseFloat(product.salePrice),
          discount: parseFloat(product.discount),
        };
      }
    } else if (
      field === "quantity" ||
      field === "pricePerUnit" ||
      field === "discount"
    ) {
      const numValue =
        typeof value === "string" ? parseFloat(value) || 0 : value;
      newItems[index] = { ...newItems[index], [field]: numValue };
    } else {
      newItems[index] = { ...newItems[index], [field]: value as string };
    }
    setLineItems(newItems);
  };

  const calculateSubtotal = (item: LineItem) => {
    const itemTotal = item.quantity * item.pricePerUnit;
    const discountAmount = itemTotal * (item.discount / 100);
    return itemTotal - discountAmount;
  };

  const calculateTotalBeforeDiscount = () => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.pricePerUnit,
      0,
    );
  };

  const calculateTotalDiscount = () => {
    return lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.pricePerUnit;
      const discountPercentage = Number(item.discount) || 0;
      return sum + itemTotal * (discountPercentage / 100);
    }, 0);
  };

  const calculateGrandTotal = () => {
    const beforeDiscount = calculateTotalBeforeDiscount();
    const discount = calculateTotalDiscount();
    const afterDiscount = beforeDiscount - discount;
    const taxAmount = afterDiscount * (tax / 100);
    return afterDiscount + taxAmount;
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("http://localhost:8000/api/customers/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          customerType: newCustomerType,
          phone: newCustomerPhone.trim() || null,
          email: newCustomerEmail.trim() || null,
          businessAddress: newCustomerAddress.trim() || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers([...customers, newCustomer]);
        setCustomerId(newCustomer.customerId);
        setIsCustomerDialogOpen(false);
        // Reset form
        setNewCustomerName("");
        setNewCustomerType("Individual");
        setNewCustomerPhone("");
        setNewCustomerEmail("");
        setNewCustomerAddress("");
      } else {
        const error = await response.json();
        alert(`Failed to add customer: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Add customer request timeout");
        alert("Request timeout. The server took too long to respond.");
      } else {
        console.error("Error adding customer:", error);
        alert("Error adding customer");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      alert("Please select a customer");
      return;
    }

    if (lineItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    // Check stock availability
    const { hasWarnings, warnings } = checkStockAvailability();
    if (hasWarnings && !proceedWithLowStock) {
      setStockWarnings(warnings);
      setStockWarningDialog(true);
      return;
    }

    setIsSubmitting(true);
    setProceedWithLowStock(false);

    try {
      const token = localStorage.getItem("token");

      // Get customer details
      const selectedCustomer = customers.find(
        (c) => c.customerId === customerId,
      );

      const invoiceData = {
        customer: customerId,
        customerName: selectedCustomer?.name || "Guest",
        customerPhone: selectedCustomer?.phone || null,
        paymentMethod,
        note,
        status,
        taxPercentage: tax.toFixed(2),
        lineItems: lineItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit.toFixed(2),
          discount: (
            item.quantity *
            item.pricePerUnit *
            (item.discount / 100)
          ).toFixed(2),
        })),
      };

      console.log("Submitting invoice data:", invoiceData);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      if (invoice) {
        // Update existing invoice
        response = await fetch(
          `http://localhost:8000/api/invoices/${invoice.invoiceId}/`,
          {
            method: "PUT",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(invoiceData),
            signal: controller.signal,
          },
        );
      } else {
        // Create new invoice
        response = await fetch("http://localhost:8000/api/invoices/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (response.ok) {
        onSuccess();
      } else {
        const errorText = await response.text();
        console.error("Error response status:", response.status);
        console.error("Error response:", errorText);

        let formattedError = "Failed to save order. Please try again.";

        try {
          const errorJson = JSON.parse(errorText);

          // Handle specific validation errors
          if (response.status === 400) {
            if (errorJson.lineItems) {
              formattedError = `Stock Issue: ${errorJson.lineItems}`;
            } else if (errorJson.detail) {
              formattedError = `Error: ${errorJson.detail}`;
            } else {
              formattedError = `Validation Error: ${JSON.stringify(errorJson)}`;
            }
          } else {
            formattedError = `Failed to save order: ${JSON.stringify(errorJson)}`;
          }
        } catch {
          formattedError = `Failed to save order: ${errorText.substring(0, 200)}`;
        }

        setErrorMessage(formattedError);
        setErrorDialog(true);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Request timeout - took longer than 30 seconds");
        setErrorMessage(
          "Request timeout. The server took too long to respond. Please try again.",
        );
      } else {
        console.error("Error saving order:", error);
        setErrorMessage("Failed to save order. Please try again.");
      }
      setErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isViewMode = !!invoice;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Order Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <div className="flex gap-2">
              <Select
                value={customerId?.toString() || ""}
                onValueChange={(value) => setCustomerId(Number(value))}
                disabled={isViewMode}
                required>
                <SelectTrigger id="customer" className="flex-1">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.customerId}
                      value={customer.customerId.toString()}>
                      {customer.name} ({customer.customerType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isViewMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCustomerDialogOpen(true)}
                  title="Add new customer">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={isViewMode}
              required>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="KHQR">KHQR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isViewMode}
              required>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax">Tax (%)</Label>
            <Input
              id="tax"
              type="number"
              step="0.01"
              min="0"
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Order Items</h3>
          {!isViewMode && (
            <Button
              type="button"
              onClick={addItem}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={index} className="border-2 rounded-lg p-4 bg-muted/30">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2 lg:col-span-2">
                  <Label>Product *</Label>
                  <Select
                    value={item.product?.toString() || ""}
                    onValueChange={(value) =>
                      updateItem(index, "product", value)
                    }
                    disabled={isViewMode}
                    required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter((p) => p.status !== "Inactive")
                        .map((product) => (
                          <SelectItem
                            key={product.productId}
                            value={product.productId.toString()}>
                            {product.productName} ($
                            {parseFloat(product.salePrice).toFixed(2)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      disabled={isViewMode}
                      required
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                      Available: {getProductStock(item.product)} units
                    </div>
                    {item.product &&
                      item.quantity > getProductStock(item.product) && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          ⚠️ Low stock!
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.pricePerUnit}
                    onChange={(e) =>
                      updateItem(index, "pricePerUnit", e.target.value)
                    }
                    disabled={isViewMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(index, "discount", e.target.value)
                      }
                      disabled={isViewMode}
                    />
                    {!isViewMode && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="ghost"
                        size="icon"
                        className="shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t mt-3">
                <div className="text-sm font-medium">
                  Subtotal:{" "}
                  <span className="text-base font-semibold">
                    ${calculateSubtotal(item).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {lineItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isViewMode
                ? "No items in this order"
                : "No items added yet. Click 'Add Item' to start."}
            </p>
          )}
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Notes</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              disabled={isViewMode}
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${calculateTotalBeforeDiscount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Total Item Discounts:</span>
              <span>-${Number(calculateTotalDiscount()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal (after discounts):</span>
              <span>
                $
                {(
                  calculateTotalBeforeDiscount() - calculateTotalDiscount()
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({tax}%):</span>
              <span>
                $
                {(
                  (calculateTotalBeforeDiscount() - calculateTotalDiscount()) *
                  (tax / 100)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Grand Total:</span>
              <span className="text-orange-600">
                ${calculateGrandTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isViewMode && (
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || lineItems.length === 0}
            className="bg-orange-600 hover:bg-orange-700">
            {isSubmitting
              ? "Saving..."
              : invoice
                ? "Update Order"
                : "Create Order"}
          </Button>
        </div>
      )}

      {isViewMode && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Close
          </Button>
        </div>
      )}

      {/* Customer Creation Dialog */}
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-type">Customer Type *</Label>
              <Select
                value={newCustomerType}
                onValueChange={setNewCustomerType}>
                <SelectTrigger id="customer-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="Enter address"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomer}
              disabled={!newCustomerName || !newCustomerType}
              className="bg-orange-600 hover:bg-orange-700">
              Add Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Warning Dialog */}
      <Dialog open={stockWarningDialog} onOpenChange={setStockWarningDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              Low Stock Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              The following items have insufficient stock available. Do you want
              to proceed anyway?
            </p>
            <div className="space-y-2">
              {stockWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-yellow-200 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="font-medium text-sm">
                    {warning.productName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Requested:{" "}
                    <span className="font-semibold">{warning.requested}</span> |
                    Available:{" "}
                    <span className="font-semibold text-red-600">
                      {warning.available}
                    </span>
                  </div>
                  <div className="text-xs text-red-600 font-medium mt-1">
                    Shortage: {warning.requested - warning.available} units
                  </div>
                </div>
              ))}
            </div>
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-600">Stock Alert</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-200">
                Proceeding may result in backordering. Ensure this is
                intentional.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStockWarningDialog(false);
                setStockWarnings([]);
              }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setProceedWithLowStock(true);
                setStockWarningDialog(false);
                // Manually trigger form submission
                const form = document.querySelector("form");
                if (form) {
                  form.dispatchEvent(
                    new Event("submit", { bubbles: true, cancelable: true }),
                  );
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700">
              Proceed Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog} onOpenChange={setErrorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Order Creation Failed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2 text-sm whitespace-pre-wrap break-words">
                {errorMessage}
              </AlertDescription>
            </Alert>
            <p className="text-xs text-muted-foreground">
              Please check the details above and try again. Contact support if
              the issue persists.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setErrorDialog(false);
                setErrorMessage("");
              }}
              className="bg-orange-600 hover:bg-orange-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
