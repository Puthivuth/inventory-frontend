"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Package,
  MapPin,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { getCurrentUser, getInventoryById } from "@/lib/api";
import { Sidebar } from "@/components/navigation/sidebar";
import { ProductAssociations } from "@/components/inventory/product-associations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InventoryItem } from "@/types";
import { useSidebarState } from "@/hooks/use-sidebar-state";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
  }, [productId]);

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
        err instanceof Error ? err.message : "Failed to load product data";
      setError(errorMessage);
      console.error("[ProductDetailPage] Error:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const getStatusStyles = () => {
    if (!product) return "bg-gray-100 text-gray-700";

    // Red for discount
    if (product.discount && product.discount > 0) {
      return "bg-red-50 text-red-700";
    }

    // Green for active
    if (product.status === "Active") {
      return "bg-green-50 text-green-700";
    }

    // Yellow for inactive
    return "bg-yellow-50 text-yellow-700";
  };

  const getStatusLabel = () => {
    if (!product) return "Unknown";
    if (product.discount && product.discount > 0) {
      return `${product.discount}% OFF`;
    }
    return product.status || "Active";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/inventory")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            {product && (
              <Button
                onClick={() => router.push(`/inventory/${productId}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                Edit Product
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-20 text-gray-500">Loading...</div>
          ) : product ? (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Main Card */}
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="grid md:grid-cols-2">
                  {/* Image */}
                  <div className="bg-gray-50 p-8 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-64 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No image</p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-semibold mb-1">
                          {product.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {product.category}
                          {product.subcategory && ` • ${product.subcategory}`}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
                        {getStatusLabel()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Cost price</p>
                        <p className="text-xl font-semibold">
                          ${product.costPrice?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sale price</p>
                        <p className="text-xl font-semibold">
                          ${product.salePrice?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">In stock</p>
                        <p className="text-2xl font-semibold">
                          {product.stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Min stock</p>
                        <p className="text-2xl font-semibold">
                          {product.minStock}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{product.location || "Primary warehouse"}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Margin</p>
                        <p className="font-medium">
                          {(
                            (((product.salePrice || 0) -
                              (product.costPrice || 0)) /
                              (product.salePrice || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Markup</p>
                        <p className="font-medium">
                          {(
                            (product.salePrice || 0) / (product.costPrice || 1)
                          ).toFixed(2)}
                          x
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Associated Products */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="font-semibold mb-4">
                  Frequently bought together
                </h3>
                <ProductAssociations
                  productId={parseInt(product.productId)}
                  productName={product.name}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              No product data
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
