"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getInventoryById, fetchAPI } from "@/lib/api";
import { Sidebar } from "@/components/navigation/sidebar";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import type { InventoryItem, InventoryFormData } from "@/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();

  useEffect(() => {
    const initializePage = () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      setIsAuthenticated(true);
      loadProductData();
    };
    initializePage();
  }, [productId, router]);

  const loadProductData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const inventoryItem = await getInventoryById(productId);
      if (!inventoryItem) {
        setError("Product not found");
        return;
      }
      setProduct(inventoryItem);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load product";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: InventoryFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      // Update product
      await fetchAPI(`/products/${product?.productId}/`, {
        method: "PUT",
        body: JSON.stringify({
          productName: formData.name,
          description: formData.description,
          skuCode: formData.sku,
          subcategory: formData.subcategory,
          source: formData.sourceId,
          status: formData.status,
          unit: formData.unit,
          costPrice: formData.costPrice,
          salePrice: formData.salePrice,
          discount: formData.discount,
          image: formData.imageUrl,
        }),
      });

      // Update inventory if stock or minStock changed
      if (product?.id) {
        await fetchAPI(`/inventory/${product.id}/`, {
          method: "PUT",
          body: JSON.stringify({
            product: product.productId,
            quantity: formData.stock,
            reorderLevel: formData.minStock,
            location: formData.location,
          }),
        });
      }

      router.push(`/inventory/${productId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save changes";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      setIsSaving(true);
      await fetchAPI(`/products/${product?.productId}/`, {
        method: "DELETE",
      });

      router.push("/inventory");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete product";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/inventory`);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back</span>
            </Button>

            {/* Center: Title */}
            <div className="flex-1 flex justify-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  const formElement = document.querySelector("form");
                  formElement?.dispatchEvent(
                    new Event("submit", { bubbles: true, cancelable: true }),
                  );
                }}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                <Save className="h-4 w-4 mr-2" />
                Update Item
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Item
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <InventoryForm
                item={product}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onDelete={handleDelete}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
