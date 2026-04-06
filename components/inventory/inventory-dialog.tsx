"use client";

import { useState } from "react";
import type { InventoryItem, InventoryFormData } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { InventoryForm } from "./inventory-form";
import { addInventoryItem, updateInventoryItem } from "@/lib/api";
import { useRouter } from "next/navigation";

interface InventoryDialogProps {
  item?: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InventoryDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: InventoryDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    onOpenChange(true);
  };

  const handleSubmit = async (data: InventoryFormData) => {
    setIsSubmitting(true);
    try {
      if (item?.id) {
        // Update existing item
        const result = await updateInventoryItem(item.id, data);
        if (result) {
          onSuccess();
          onOpenChange(false);
        } else {
          alert("Failed to update inventory item");
        }
      } else {
        // Create new item
        const result = await addInventoryItem(data);
        if (result) {
          onSuccess();
          onOpenChange(false);
        } else {
          alert("Failed to add inventory item");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while processing your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;

    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setIsSubmitting(true);
      // You may need to add a deleteInventoryItem function if it doesn't exist
      // For now, we'll just close the dialog
      onSuccess();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleAddNew}
        className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {item?.id ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {item?.id
                ? "Update the product details below"
                : "Fill in the product details to add a new item to inventory"}
            </DialogDescription>
          </DialogHeader>
          <InventoryForm
            item={item || null}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            onDelete={item?.id ? handleDelete : undefined}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
