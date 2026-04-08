"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getInventoryItems } from "@/lib/api";
import { Sidebar } from "@/components/navigation/sidebar";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useImageSearch } from "@/hooks/use-image-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";
import type { InventoryItem } from "@/types";

export default function ImageSearchPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [scoreThreshold, setScoreThreshold] = useState(0.3);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [currentSearchFile, setCurrentSearchFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    error,
    results,
    hasSearched,
    searchByImage,
    searchByUrl,
    clearResults,
  } = useImageSearch();

  // Filter results by inventory AND similarity threshold
  const filteredResults = useMemo(() => {
    console.log(
      "🔍 Search Results:",
      results.length,
      "items | Inventory:",
      inventoryItems.length,
      "items | Threshold:",
      scoreThreshold,
    );

    if (!results.length) {
      console.log("ℹ️  No search results returned from backend");
      return [];
    }

    if (!inventoryItems.length) {
      console.log("ℹ️  Inventory not loaded yet");
      return results.filter(
        (result) => result.similarity_score >= scoreThreshold,
      );
    }

    const inventoryIds = new Set<string | number>();
    inventoryItems.forEach((item) => {
      if (item.productId) inventoryIds.add(String(item.productId));
      if (item.id) inventoryIds.add(String(item.id));
    });

    console.log(
      "Inventory IDs:",
      Array.from(inventoryIds),
      "Search Product IDs:",
      results.map((r) => r.product_id),
    );

    const filtered = results.filter(
      (result) =>
        inventoryIds.has(String(result.product_id)) &&
        result.similarity_score >= scoreThreshold,
    );

    if (results.length > 0 && filtered.length === 0) {
      console.warn(
        "⚠️  ID Mismatch: Search found",
        results.length,
        "products but none match inventory IDs",
      );
    } else if (results.length > 0) {
      console.log("✓ Filtered Results:", filtered.length, "matching products");
    }

    return filtered;
  }, [results, inventoryItems, scoreThreshold]);

  useEffect(() => {
    const initializeAuth = async () => {
      const user = getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setIsAuthenticated(true);
      await loadInventory();
    };
    initializeAuth();
  }, [router]);

  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      const items = await getInventoryItems();
      setInventoryItems(items);
      console.log(
        "✓ Inventory loaded:",
        items.length,
        "items with IDs:",
        items.map((i) => i.productId || i.id).join(", "),
      );
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentSearchFile(file);
    setImageUrl(""); // Clear URL when using file

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Search
    await searchByImage(file, topK, scoreThreshold);
  };

  const handleUrlSearch = async () => {
    if (!imageUrl.trim()) {
      alert("Please enter an image URL");
      return;
    }
    setCurrentSearchFile(null); // Clear file when using URL
    setPreviewImage(imageUrl);
    await searchByUrl(imageUrl, topK, scoreThreshold);
  };

  const handleReset = () => {
    clearResults();
    setImageUrl("");
    setPreviewImage(null);
    setCurrentSearchFile(null);
    setTopK(10);
    setScoreThreshold(0.3);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRefresh = () => {
    // Reset threshold and top_k to defaults
    setTopK(10);
    setScoreThreshold(0.3);
  };

  const handleApplyFilters = async () => {
    // Re-search with current topK and scoreThreshold values
    if (currentSearchFile) {
      // If a file was uploaded, re-search by image with new filters
      await searchByImage(currentSearchFile, topK, scoreThreshold);
    } else if (imageUrl) {
      // If a URL is being used, re-search by URL with new filters
      await searchByUrl(imageUrl, topK, scoreThreshold);
    }
  };

  const handleBack = () => {
    router.push("/inventory");
  };

  // Show upload interface only if no image has been selected
  const showUploadInterface = !previewImage && !hasSearched;

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
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back</span>
            </Button>

            {/* Center: Title */}
            <div className="flex-1 flex justify-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Products by Image
              </h2>
            </div>

            {/* Right: New Search button */}
            {hasSearched && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center gap-2">
                <X className="h-4 w-4" />
                New Search
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Upload Interface - Only show if no image selected */}
            {showUploadInterface ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <Card className="border-2 border-dashed h-fit">
                  <CardHeader>
                    <CardTitle>Upload Image</CardTitle>
                    <CardDescription>
                      Upload a product image to find similar products
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">
                        Click to upload an image
                      </p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                  </CardContent>
                </Card>

                {/* URL Search Section */}
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle>Search by URL</CardTitle>
                    <CardDescription>
                      Or paste an image URL to search
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      onClick={handleUrlSearch}
                      disabled={isLoading || !imageUrl.trim()}
                      className="w-full"
                      size="lg">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Search by URL
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                {/* Search Results View */}
                <div className="space-y-6">
                  {/* Preview & Parameters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        Query Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Image Preview */}
                      {previewImage && (
                        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={previewImage}
                            alt="Query image"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}

                      {/* Parameters */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Number of Results: {topK}
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={topK}
                            onChange={(e) =>
                              setTopK(
                                Math.min(
                                  50,
                                  Math.max(1, parseInt(e.target.value) || 1),
                                ),
                              )
                            }
                            className="w-24 h-10"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            How many similar products to display (1-50)
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Similarity Threshold: {scoreThreshold.toFixed(2)}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={scoreThreshold}
                            onChange={(e) =>
                              setScoreThreshold(
                                Math.min(
                                  1,
                                  Math.max(0, parseFloat(e.target.value) || 0),
                                ),
                              )
                            }
                            className="w-24 h-10"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            0.0 (opposite) → 1.0 (identical) - Lower = More
                            results
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleApplyFilters}
                            variant="default"
                            disabled={!previewImage}
                            className="flex-1">
                            Apply Filters
                          </Button>
                          <Button
                            onClick={handleRefresh}
                            variant="outline"
                            disabled={!previewImage}
                            className="flex-1">
                            Reset Filters
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Error State */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Searching similar products...
                      </p>
                    </div>
                  </div>
                )}

                {/* Results */}
                {hasSearched && !isLoading && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Similar Products ({filteredResults.length})
                      {results.length > filteredResults.length && (
                        <span className="text-sm text-orange-600 ml-2">
                          (Backend found {results.length} results)
                        </span>
                      )}
                    </h2>

                    {filteredResults.length === 0 ? (
                      <Card className="text-center py-12">
                        <CardContent>
                          {results.length === 0 ? (
                            <>
                              <p className="text-gray-500">
                                No similar products found. Try adjusting the
                                similarity threshold or search with a different
                                image.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-500">
                                Backend found {results.length} similar
                                product(s), but they don't match your inventory.
                              </p>
                              <p className="text-xs text-gray-400 mt-3">
                                This may be a product ID mismatch. Check the
                                browser console for details.
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResults.map((product, index) => (
                          <Card
                            key={`${product.product_id}-${index}`}
                            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/inventory/${product.product_id}/edit`,
                              )
                            }>
                            <div className="relative w-full h-40 bg-gray-100">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.product_name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <ImageIcon className="h-8 w-8 text-gray-300" />
                                </div>
                              )}
                              {/* Similarity Score Badge */}
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-blue-600 hover:bg-blue-700">
                                  {(product.similarity_score * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            </div>

                            <CardContent className="p-4 space-y-2">
                              <div>
                                <p className="font-semibold text-gray-900 line-clamp-2">
                                  {product.product_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU: {product.sku_code}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <div>
                                  <p className="text-xs text-gray-500">Price</p>
                                  <p className="font-semibold text-gray-900">
                                    ${product.sale_price?.toFixed(2) || "N/A"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Similarity
                                  </p>
                                  <p className="font-semibold text-blue-600">
                                    {(product.similarity_score * 100).toFixed(
                                      1,
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
