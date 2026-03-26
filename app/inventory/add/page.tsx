"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/navigation/sidebar";
import { getCurrentUser } from "@/lib/api";
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
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Create product
      const productResponse = await fetch(
        "http://localhost:8000/api/products/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
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
        },
      );

      if (!productResponse.ok) {
        let errorData: any = {};
        let responseText = "";

        try {
          responseText = await productResponse.text();

          // Try to parse as JSON if it looks like JSON
          if (responseText && responseText.trim().startsWith("{")) {
            try {
              errorData = JSON.parse(responseText);
            } catch (e) {
              errorData = { rawResponse: responseText };
            }
          } else {
            errorData = {
              rawResponse: responseText || "(empty response body)",
            };
          }
        } catch (readError) {
          console.error("[AddProductPage] Failed to read response:", readError);
          errorData = { readError: String(readError) };
        }

        console.error(
          "[AddProductPage] Product creation failed:",
          JSON.stringify(
            {
              status: productResponse.status,
              statusText: productResponse.statusText,
              contentType: productResponse.headers.get("content-type"),
              error: errorData,
              requestPayload: {
                productName: formData.name,
                description: formData.description,
                skuCode: formData.sku,
                subcategory: formData.subcategory,
                source: formData.sourceId,
                status: formData.status,
                unit: formData.unit,
                salePrice: formData.salePrice,
              },
              backend: "http://localhost:8000/api/products/",
            },
            null,
            2,
          ),
        );

        let errorMessage = "";

        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.rawResponse) {
          errorMessage = errorData.rawResponse;
        } else if (errorData.readError) {
          errorMessage = `Failed to read error response: ${errorData.readError}`;
        } else {
          // Extract first string error from object
          const stringErrors = Object.entries(errorData)
            .filter(([_, v]) => typeof v === "string")
            .map(([k, v]) => `${k}: ${v}`);
          errorMessage =
            stringErrors.join(", ") ||
            `Failed to create product (HTTP ${productResponse.status} ${productResponse.statusText})`;
        }

        throw new Error(errorMessage);
      }

      const product = await productResponse.json();

      // Create inventory record
      const inventoryResponse = await fetch(
        "http://localhost:8000/api/inventory/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: product.productId,
            quantity: formData.stock,
            reorderLevel: formData.minStock,
            location: formData.location,
          }),
        },
      );

      if (!inventoryResponse.ok) {
        let errorData: any = {};
        let responseText = "";

        try {
          responseText = await inventoryResponse.text();

          // Try to parse as JSON if it looks like JSON
          if (responseText && responseText.trim().startsWith("{")) {
            try {
              errorData = JSON.parse(responseText);
            } catch (e) {
              errorData = { rawResponse: responseText };
            }
          } else {
            errorData = {
              rawResponse: responseText || "(empty response body)",
            };
          }
        } catch (readError) {
          console.error(
            "[AddProductPage] Failed to read inventory response:",
            readError,
          );
          errorData = { readError: String(readError) };
        }

        console.error(
          "[AddProductPage] Inventory creation failed:",
          JSON.stringify(
            {
              status: inventoryResponse.status,
              statusText: inventoryResponse.statusText,
              contentType: inventoryResponse.headers.get("content-type"),
              error: errorData,
              requestPayload: {
                product: product.productId,
                quantity: formData.stock,
                reorderLevel: formData.minStock,
                location: formData.location,
              },
              backend: "http://localhost:8000/api/inventory/",
            },
            null,
            2,
          ),
        );

        let errorMessage = "";

        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.rawResponse) {
          errorMessage = errorData.rawResponse;
        } else if (errorData.readError) {
          errorMessage = `Failed to read error response: ${errorData.readError}`;
        } else {
          const stringErrors = Object.entries(errorData)
            .filter(([_, v]) => typeof v === "string")
            .map(([k, v]) => `${k}: ${v}`);
          errorMessage =
            stringErrors.join(", ") ||
            `Failed to create inventory record (HTTP ${inventoryResponse.status} ${inventoryResponse.statusText})`;
        }

        throw new Error(errorMessage);
      }

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
