"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getInventoryItems } from "@/lib/api";
import { Sidebar } from "@/components/navigation/sidebar";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useImageSearch, Detection } from "@/hooks/use-image-search";
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
  MousePointer2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
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
  
  // Object Detection State
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedBox, setSelectedBox] = useState<number[] | null>(null);
  const [draftBox, setDraftBox] = useState<number[] | null>(null);
  const [detectionMode, setDetectionMode] = useState<"auto" | "manual">("auto");
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    isLoading,
    error,
    results,
    hasSearched,
    detectObjects,
    searchByImage,
    searchByUrl,
    clearResults,
  } = useImageSearch();

  // Filter results by inventory AND similarity threshold
  const filteredResults = useMemo(() => {
    if (!results.length) return [];

    if (!inventoryItems.length) {
      return results.filter(
        (result) => result.similarity_score >= scoreThreshold,
      );
    }

    const inventoryIds = new Set<string | number>();
    inventoryItems.forEach((item) => {
      if (item.productId) inventoryIds.add(String(item.productId));
      if (item.id) inventoryIds.add(String(item.id));
    });

    return results.filter(
      (result) =>
        inventoryIds.has(String(result.product_id)) &&
        result.similarity_score >= scoreThreshold,
    );
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
    setImageUrl(""); 
    clearResults();
    setDetections([]);
    setSelectedBox(null);
    setDraftBox(null);
    setDetectionMode("auto");

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Automatically detect objects first
    const detected = await detectObjects(file);
    setDetections(detected);

    // Auto-select highest confidence box if in auto mode
    if (detected.length > 0) {
      const best = [...detected].sort((a, b) => b.confidence - a.confidence)[0];
      setSelectedBox(best.box);
    }
  };

  const handleObjectSelect = (box: number[]) => {
    setSelectedBox(box);
    setDraftBox(null);
  };

  const handleSearch = async () => {
    if (!currentSearchFile) return;
    await searchByImage(currentSearchFile, topK, scoreThreshold, selectedBox || undefined);
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
  };

  const getSvgPoint = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || imageSize.width === 0 || imageSize.height === 0) {
      return null;
    }

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) {
      return null;
    }

    const transformedPoint = point.matrixTransform(screenCTM.inverse());

    return {
      x: clamp(transformedPoint.x, 0, imageSize.width),
      y: clamp(transformedPoint.y, 0, imageSize.height),
    };
  };

  const normalizeBox = (box: number[]) => {
    const x1 = clamp(Math.min(box[0], box[2]), 0, imageSize.width);
    const y1 = clamp(Math.min(box[1], box[3]), 0, imageSize.height);
    const x2 = clamp(Math.max(box[0], box[2]), 0, imageSize.width);
    const y2 = clamp(Math.max(box[1], box[3]), 0, imageSize.height);

    if (x2 - x1 < 4 || y2 - y1 < 4) {
      return null;
    }

    return [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)];
  };

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (detectionMode !== "manual") {
      return;
    }

    const point = getSvgPoint(event);
    if (!point) {
      return;
    }

    setSelectedBox(null);
    setDraftBox([point.x, point.y, point.x, point.y]);
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (detectionMode !== "manual" || !draftBox) {
      return;
    }

    const point = getSvgPoint(event);
    if (!point) {
      return;
    }

    setDraftBox((current) =>
      current ? [current[0], current[1], point.x, point.y] : current,
    );
  };

  const handleSvgMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    if (detectionMode !== "manual" || !draftBox) {
      return;
    }

    const point = getSvgPoint(event);
    if (!point) {
      return;
    }

    const finalizedBox = normalizeBox([
      draftBox[0],
      draftBox[1],
      point.x,
      point.y,
    ]);

    setDraftBox(null);

    if (finalizedBox) {
      setSelectedBox(finalizedBox);
    }
  };

  const handleFullImageSearch = async () => {
    if (!currentSearchFile) return;
    await searchByImage(currentSearchFile, topK, scoreThreshold);
  };

  const handleUrlSearch = async () => {
    if (!imageUrl.trim()) {
      alert("Please enter an image URL");
      return;
    }
    setCurrentSearchFile(null);
    setPreviewImage(imageUrl);
    setDetections([]);
    await searchByUrl(imageUrl, topK, scoreThreshold);
  };

  const handleReset = () => {
    clearResults();
    setImageUrl("");
    setPreviewImage(null);
    setCurrentSearchFile(null);
    setDetections([]);
    setTopK(10);
    setScoreThreshold(0.3);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const showUploadInterface = !previewImage && !hasSearched && !isLoading;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/inventory")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back</span>
            </Button>

            <div className="flex-1 flex justify-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Object Search (YOLO + CLIP)
              </h2>
            </div>

            {previewImage && (
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
            {showUploadInterface ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-2 border-dashed h-fit">
                  <CardHeader>
                    <CardTitle>Upload Image</CardTitle>
                    <CardDescription>
                      Upload a photo to detect and search for specific products
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="font-semibold text-lg text-gray-900">
                        Click to upload an image
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        YOLOv8 will detect all products automatically
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle>Search by URL</CardTitle>
                    <CardDescription>
                      Or paste an image link to search
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="https://example.com/product.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="h-12"
                    />
                    <Button
                      onClick={handleUrlSearch}
                      disabled={isLoading || !imageUrl.trim()}
                      className="w-full h-12 text-base"
                      size="lg">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <ImageIcon className="mr-2 h-5 w-5" />
                      )}
                      Search by URL
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Image Preview & Detection Overlay */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-gray-200/50 rounded-xl border border-gray-200">
                    <div className="flex bg-white rounded-lg shadow-sm p-1">
                      <Button
                        variant={detectionMode === "auto" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setDetectionMode("auto");
                          setSelectedBox(detections.length > 0 ? detections[0].box : null);
                        }}
                        className="h-9 px-4 text-sm gap-2 font-medium">
                        <ImageIcon className="h-4 w-4" />
                        AI Detection
                      </Button>
                      <Button
                        variant={detectionMode === "manual" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setDetectionMode("manual");
                          setSelectedBox(null);
                        }}
                        className="h-9 px-4 text-sm gap-2 font-medium">
                        <MousePointer2 className="h-4 w-4" />
                        Manual Mode
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pr-1">
                      {previewImage && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSearch}
                          disabled={isLoading}
                          className="h-9 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ImageIcon className="h-4 w-4 mr-2" />
                          )}
                          {selectedBox ? "Search Selection" : "Search Full Image"}
                        </Button>
                      )}
                      {selectedBox && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBox(null)}
                          className="h-9 px-3 text-sm text-gray-500 hover:text-gray-900">
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <Card className="overflow-hidden border-2">
                    <CardContent className="p-0 relative bg-gray-50 min-h-[500px] flex items-center justify-center">
                      {previewImage && (
                        <div className="relative w-full h-full flex items-center justify-center group overflow-hidden">
                          <img
                            src={previewImage}
                            alt="Query"
                            className="max-w-full max-h-[700px] object-contain select-none"
                            onLoad={onImageLoad}
                          />
                          
                          {/* Interactive Overlay */}
                          {imageSize.width > 0 && (
                            <svg
                              ref={svgRef}
                              className={`absolute inset-0 w-full h-full ${detectionMode === "manual" ? "cursor-crosshair" : "cursor-default"}`}
                              viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                              preserveAspectRatio="xMidYMid meet"
                              onMouseDown={handleSvgMouseDown}
                              onMouseMove={handleSvgMouseMove}
                              onMouseUp={handleSvgMouseUp}
                              onMouseLeave={handleSvgMouseUp}
                            >
                              {/* YOLO Detection Boxes (only in auto mode) */}
                              {detectionMode === "auto" && detections.map((det, i) => (
                                <g key={i} className="pointer-events-auto cursor-pointer group/box" onClick={() => handleObjectSelect(det.box)}>
                                  <rect
                                    x={det.box[0]}
                                    y={det.box[1]}
                                    width={det.box[2] - det.box[0]}
                                    height={det.box[3] - det.box[1]}
                                    className={`transition-all group-hover/box:fill-blue-500/10 ${
                                      selectedBox &&
                                      det.box[0] === selectedBox[0] &&
                                      det.box[1] === selectedBox[1] &&
                                      det.box[2] === selectedBox[2] &&
                                      det.box[3] === selectedBox[3]
                                        ? "fill-blue-500/10 stroke-blue-600 stroke-[3]"
                                        : "fill-transparent stroke-blue-400/50 stroke-1 hover:stroke-blue-500/80"
                                    }`}
                                  />
                                  {det.confidence > 0.1 && (
                                    <foreignObject
                                      x={det.box[0]}
                                      y={det.box[1] - 25}
                                      width="150"
                                      height="25"
                                    >
                                      <div className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-t inline-block whitespace-nowrap shadow-sm">
                                        {det.label} ({(det.confidence * 100).toFixed(0)}%)
                                      </div>
                                    </foreignObject>
                                  )}
                                </g>
                              ))}

                              {/* Selected Box Highlight */}
                              {selectedBox && (
                                <g pointerEvents="none">
                                  <rect
                                    x={selectedBox[0]}
                                    y={selectedBox[1]}
                                    width={selectedBox[2] - selectedBox[0]}
                                    height={selectedBox[3] - selectedBox[1]}
                                    className="fill-amber-500/10 stroke-amber-500 stroke-[3]"
                                  />
                                  <foreignObject
                                    x={selectedBox[0]}
                                    y={Math.max(0, selectedBox[1] - 25)}
                                    width="150"
                                    height="25"
                                  >
                                    <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-t inline-block whitespace-nowrap shadow-lg">
                                      {detectionMode === "manual" ? "Manual Selection" : "Current Selection"}
                                    </div>
                                  </foreignObject>
                                </g>
                              )}

                              {/* Drawing Draft Box */}
                              {draftBox && (
                                <g pointerEvents="none">
                                  <rect
                                    x={Math.min(draftBox[0], draftBox[2])}
                                    y={Math.min(draftBox[1], draftBox[3])}
                                    width={Math.abs(draftBox[2] - draftBox[0])}
                                    height={Math.abs(draftBox[3] - draftBox[1])}
                                    className="fill-blue-500/10 stroke-blue-500 stroke-2"
                                    style={{ strokeDasharray: "6 4" }}
                                  />
                                </g>
                              )}
                            </svg>
                          )}

                          {detectionMode === "manual" && !selectedBox && !draftBox && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 backdrop-blur-[1px]">
                              <div className="bg-white/95 shadow-xl text-blue-700 px-6 py-3 rounded-2xl text-sm font-bold border-2 border-blue-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                <MousePointer2 className="h-5 w-5 animate-bounce" />
                                Click and drag to define search area
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side: Results & Parameters */}
                <div className="space-y-6">
                  {/* Controls */}
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Search Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium">Similarity Threshold</label>
                          <span className="text-sm font-bold text-blue-600">{scoreThreshold.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={scoreThreshold}
                          onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[10px] text-gray-500">Lower means more (but less precise) results.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium">Top Results</label>
                          <span className="text-sm font-bold text-blue-600">{topK}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={topK}
                          onChange={(e) => setTopK(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results Section */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center justify-between">
                      Results
                      {hasSearched && (
                        <Badge variant="secondary">{filteredResults.length}</Badge>
                      )}
                    </h3>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    )}

                    {isLoading && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-lg border">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">
                          {detections.length > 0 ? "Analyzing object..." : "Processing image..."}
                        </p>
                      </div>
                    )}

                    {!isLoading && hasSearched && (
                      <div className="space-y-3">
                        {filteredResults.length > 0 ? (
                          filteredResults.map((product, idx) => (
                            <Card
                              key={`${product.product_id}-${idx}`}
                              className="hover:border-blue-500 transition-colors cursor-pointer group"
                              onClick={() => router.push(`/inventory/${product.product_id}/edit`)}
                            >
                              <CardContent className="p-3">
                                <div className="flex gap-3">
                                  {product.image_url && (
                                    <div className="relative h-16 w-16 flex-shrink-0 rounded bg-gray-50 overflow-hidden border">
                                      <Image
                                        src={product.image_url}
                                        alt={product.product_name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <h4 className="font-bold text-sm truncate group-hover:text-blue-600 transition-colors">
                                        {product.product_name}
                                      </h4>
                                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                        {(product.similarity_score * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mb-1">SKU: {product.sku_code}</p>
                                    <p className="text-sm font-bold">${product.sale_price.toFixed(2)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No matches found for this selection.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!hasSearched && !isLoading && !error && (
                      <div className="text-center py-16 bg-white rounded-lg border border-dashed">
                        <MousePointer2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 px-6">
                          {previewImage 
                            ? "Click on one of the detected boxes in the image to start searching." 
                            : "Upload an image to begin object detection."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
