"use client";

import { useState, useRef, useEffect } from "react";
import { useImageSearch, Detection } from "@/hooks/use-image-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Image as ImageIcon,
  Search,
  Upload,
  Loader2,
  MousePointer2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface ImageSearchDialogProps {
  onProductSelect?: (productId: number) => void;
}

export function ImageSearchDialog({ onProductSelect }: ImageSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [topK, setTopK] = useState(10);
  const [scoreThreshold, setScoreThreshold] = useState(0.5);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedBox, setSelectedBox] = useState<number[] | null>(null);
  const [draftBox, setDraftBox] = useState<number[] | null>(null);
  const [detectionMode, setDetectionMode] = useState<"auto" | "manual">("auto");
  const [showYoloBoxes, setShowYoloBoxes] = useState(true);

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

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    clearResults();
    setDetections([]);
    setSelectedBox(null);
    setDraftBox(null);
    setDetectionMode("auto");
    setShowYoloBoxes(true);

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Detect objects first
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
    if (!selectedFile) return;
    
    // Use selectedBox if available, otherwise search full image
    await searchByImage(
      selectedFile,
      topK,
      scoreThreshold,
      selectedBox || undefined,
    );
  };

  const handleUrlSearch = async () => {
    if (!imageUrl.trim()) {
      alert("Please enter an image URL");
      return;
    }
    setPreviewImage(imageUrl);
    await searchByUrl(imageUrl, topK, scoreThreshold);
  };

  const handleReset = () => {
    clearResults();
    setImageUrl("");
    setPreviewImage(null);
    setSelectedFile(null);
    setDetections([]);
    setSelectedBox(null);
    setDraftBox(null);
    setDetectionMode("auto");
    setShowYoloBoxes(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  // Update image natural size when loaded
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ImageIcon className="h-4 w-4" />
          Search by Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Object Search (YOLO + CLIP)</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Click to upload an image</span>
                <span className="text-sm text-muted-foreground">
                  YOLO will automatically detect objects
                </span>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button
                onClick={handleUrlSearch}
                disabled={isLoading || !imageUrl.trim()}
                className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview with Detections */}
        {previewImage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 p-1 bg-muted rounded-lg">
              <div className="flex bg-background rounded-md shadow-sm p-0.5">
                <Button
                  variant={detectionMode === "auto" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setDetectionMode("auto");
                    setShowYoloBoxes(true);
                  }}
                  className="h-8 px-3 text-xs gap-2">
                  <Search className="h-3 w-3" />
                  AI Detection
                </Button>
                <Button
                  variant={detectionMode === "manual" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setDetectionMode("manual");
                    setShowYoloBoxes(false);
                    setSelectedBox(null);
                  }}
                  className="h-8 px-3 text-xs gap-2">
                  <MousePointer2 className="h-3 w-3" />
                  Manual Mode
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {selectedFile && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="h-8 px-4 text-xs font-bold bg-primary hover:bg-primary/90">
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Search className="h-3 w-3 mr-1" />
                    )}
                    {selectedBox ? "Search Selection" : "Search Full Image"}
                  </Button>
                )}
                {selectedBox && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBox(null)}
                    className="h-8 px-2 text-xs">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden group border">
              <img
                ref={imageRef}
                src={previewImage}
                alt="Search preview"
                className="w-full h-full object-contain"
                onLoad={onImageLoad}
              />

              {/* SVG Overlay for Bounding Boxes */}
              {imageSize.width > 0 && (
                <svg
                  ref={svgRef}
                  className={`absolute inset-0 w-full h-full ${detectionMode === "manual" ? "cursor-crosshair" : "cursor-default"}`}
                  viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                  preserveAspectRatio="xMidYMid meet"
                  onMouseDown={handleSvgMouseDown}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}>
                  {showYoloBoxes &&
                    detections.map((det, i) => (
                      <g
                        key={i}
                        className="pointer-events-auto cursor-pointer group/box"
                        onClick={() => handleObjectSelect(det.box)}>
                        <rect
                          x={det.box[0]}
                          y={det.box[1]}
                          width={det.box[2] - det.box[0]}
                          height={det.box[3] - det.box[1]}
                          className={`transition-all group-hover/box:fill-primary/20 ${
                            selectedBox &&
                            det.box[0] === selectedBox[0] &&
                            det.box[1] === selectedBox[1] &&
                            det.box[2] === selectedBox[2] &&
                            det.box[3] === selectedBox[3]
                              ? "fill-primary/10 stroke-primary stroke-2"
                              : "fill-primary/0 stroke-muted-foreground/50 stroke-1"
                          }`}
                        />
                        {det.confidence > 0.1 && (
                          <foreignObject
                            x={det.box[0]}
                            y={det.box[1] - 22}
                            width="100"
                            height="22">
                            <div className="bg-primary/80 backdrop-blur-sm text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-t inline-block whitespace-nowrap">
                              {det.label} ({(det.confidence * 100).toFixed(0)}%)
                            </div>
                          </foreignObject>
                        )}
                      </g>
                    ))}
                  
                  {/* Selected Box (can be from AI or Manual) */}
                  {selectedBox && (
                    <g pointerEvents="none">
                      <rect
                        x={selectedBox[0]}
                        y={selectedBox[1]}
                        width={selectedBox[2] - selectedBox[0]}
                        height={selectedBox[3] - selectedBox[1]}
                        className="fill-amber-500/10 stroke-amber-500 stroke-2"
                      />
                      <foreignObject
                        x={selectedBox[0]}
                        y={Math.max(0, selectedBox[1] - 22)}
                        width="120"
                        height="22">
                        <div className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-t font-bold inline-block whitespace-nowrap">
                          {detectionMode === "manual" ? "Manual selection" : "AI selection"}
                        </div>
                      </foreignObject>
                    </g>
                  )}
                  
                  {draftBox && (
                    <g pointerEvents="none">
                      <rect
                        x={Math.min(draftBox[0], draftBox[2])}
                        y={Math.min(draftBox[1], draftBox[3])}
                        width={Math.abs(draftBox[2] - draftBox[0])}
                        height={Math.abs(draftBox[3] - draftBox[1])}
                        className="fill-blue-500/10 stroke-blue-500 stroke-2"
                        style={{ strokeDasharray: "4 2" }}
                      />
                    </g>
                  )}
                </svg>
              )}

              {detectionMode === "manual" && !selectedBox && !draftBox && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5">
                  <div className="bg-white/90 backdrop-blur shadow-md text-primary px-4 py-2 rounded-lg text-xs font-medium border border-primary/20 flex items-center gap-2">
                    <MousePointer2 className="h-4 w-4" />
                    Click and drag to draw a bounding box
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Top Results: {topK}</label>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Score Threshold: {scoreThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {detections.length > 0
                ? "Searching for similar products..."
                : "Detecting objects..."}
            </p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-t pt-4">
              <h3 className="font-semibold text-lg">
                Search Results ({results.length})
              </h3>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Clear
              </Button>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
                {results.map((product) => (
                  <Card
                    key={product.product_id}
                    className="overflow-hidden hover:border-primary transition-colors cursor-pointer"
                    onClick={() => {
                      if (onProductSelect) onProductSelect(product.product_id);
                      setOpen(false);
                    }}>
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-3">
                        {product.image_url && (
                          <div className="relative h-24 w-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                            <Image
                              src={product.image_url}
                              alt={product.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-base truncate">
                              {product.product_name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200">
                              {(product.similarity_score * 100).toFixed(0)}%
                              Match
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            SKU: {product.sku_code}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-primary">
                              ${product.sale_price.toFixed(2)}
                            </span>
                            {product.cost_price > product.sale_price && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${product.cost_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                            {product.description || "No description available"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No matching products found for this object. Try a different
                  object or adjust the threshold.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
