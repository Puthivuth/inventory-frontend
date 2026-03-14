"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Customer {
  customerId: number;
  name: string;
  businessAddress: string;
  phone: string;
  email: string | null;
  customerType: string;
  firstPurchaseDate: string | null;
  createdAt: string;
}

interface CustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerDialog({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: CustomerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    businessAddress: "",
    phone: "",
    email: "",
    customerType: "Individual",
    firstPurchaseDate: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        businessAddress: customer.businessAddress,
        phone: customer.phone,
        email: customer.email || "",
        customerType: customer.customerType,
        firstPurchaseDate: customer.firstPurchaseDate || "",
      });
    } else {
      setFormData({
        name: "",
        businessAddress: "",
        phone: "",
        email: "",
        customerType: "Individual",
        firstPurchaseDate: "",
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const url = customer
        ? `http://localhost:8000/api/customers/${customer.customerId}/`
        : "http://localhost:8000/api/customers/";

      const method = customer ? "PUT" : "POST";

      const payload: any = {
        name: formData.name,
        businessAddress: formData.businessAddress,
        phone: formData.phone,
        email: formData.email || null,
        customerType: formData.customerType,
      };

      // Only include firstPurchaseDate when creating new customer (not when editing)
      if (!customer && formData.firstPurchaseDate) {
        payload.firstPurchaseDate = formData.firstPurchaseDate;
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error("Failed to save customer:", errorData);
        alert(`Failed to save customer: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Error saving customer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerType">Customer Type *</Label>
              <select
                id="customerType"
                value={formData.customerType}
                onChange={(e) =>
                  setFormData({ ...formData, customerType: e.target.value })
                }
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email (optional)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Address *</Label>
            <Textarea
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) =>
                setFormData({ ...formData, businessAddress: e.target.value })
              }
              required
              placeholder="Enter business address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstPurchaseDate">First Purchase Date</Label>
            <Input
              id="firstPurchaseDate"
              type="date"
              value={formData.firstPurchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, firstPurchaseDate: e.target.value })
              }
              disabled={customer && customer.firstPurchaseDate ? true : false}
              title={
                customer && customer.firstPurchaseDate
                  ? "Auto-populated from purchase history"
                  : ""
              }
            />
            {customer && customer.firstPurchaseDate && (
              <p className="text-xs text-muted-foreground">
                Automatically populated from first purchase invoice
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {customer ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
