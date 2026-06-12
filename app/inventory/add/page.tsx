"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/navigation/sidebar";
import { getCurrentUser, fetchAPI } from "@/lib/api";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import type { InventoryFormData } from "@/types";

export default function AddProductPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();

  // Check authentication on mount (after hydration)
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/auth/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleSubmit = async (formData: InventoryFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create product
      const product = await fetchAPI("/products/", {
        method: "POST",
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

      // Create inventory record
      await fetchAPI("/inventory/", {
        method: "POST",
        body: JSON.stringify({
          product: product.productId,
          quantity: formData.stock,
          reorderLevel: formData.minStock,
          location: formData.location,
        }),
      });

      // Success - redirect to inventory list
      router.push("/inventory");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create product";
      setError(errorMessage);
      console.error("[AddProductPage] Error:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  if (!isAuthenticated) {
    return null;
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
              <h2 className="text-2xl font-bold text-gray-900">Add Product</h2>
            </div>

            {/* Right: Save button */}
            <Button
              onClick={() => {
                const formElement = document.querySelector("form");
                formElement?.dispatchEvent(
                  new Event("submit", { bubbles: true, cancelable: true }),
                );
              }}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
              Add product
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <InventoryForm
                item={null}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
