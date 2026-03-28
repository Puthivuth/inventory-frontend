"use client"

import { useState, useRef } from "react"
import { useImageSearch } from "@/hooks/use-image-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Image as ImageIcon, Search, Upload, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"

interface ImageSearchDialogProps {
  onProductSelect?: (productId: number) => void
}

export function ImageSearchDialog({ onProductSelect }: ImageSearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [topK, setTopK] = useState(10)
  const [scoreThreshold, setScoreThreshold] = useState(0.5)

  const { 
    isLoading, 
    error, 
    results, 
    hasSearched, 
    searchByImage, 
    searchByUrl, 
    clearResults 
  } = useImageSearch()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Preview image
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Search
    await searchByImage(file, topK, scoreThreshold)
  }

  const handleUrlSearch = async () => {
    if (!imageUrl.trim()) {
      alert("Please enter an image URL")
      return
    }
    setPreviewImage(imageUrl)
    await searchByUrl(imageUrl, topK, scoreThreshold)
  }

  const handleReset = () => {
    clearResults()
    setImageUrl("")
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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
          <DialogTitle>Search Products by Image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors">
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
                className="w-full flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Click to upload an image</span>
                <span className="text-sm text-muted-foreground">
                  or drag and drop
                </span>
              </button>
            </div>
          </TabsContent>

          {/* URL Tab */}
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
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
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

        {/* Preview */}
        {previewImage && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
              <Image
                src={previewImage}
                alt="Search preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Top Results: {topK}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full"
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
              className="w-full"
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Found {results.length} similar product{results.length !== 1 ? "s" : ""}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
              >
                New Search
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((product) => (
                <Card key={product.product_id} className="cursor-pointer hover:bg-muted transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      {product.image_url && (
                        <div className="relative h-20 w-20 flex-shrink-0 bg-muted rounded">
                          <Image
                            src={product.image_url}
                            alt={product.product_name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold line-clamp-1">
                              {product.product_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku_code}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {(product.similarity_score * 100).toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Price Info */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium">
                            ${product.sale_price.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.cost_price.toFixed(2)}
                          </span>
                        </div>

                        {/* Action Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => {
                            if (onProductSelect) {
                              onProductSelect(product.product_id)
                            }
                            setOpen(false)
                          }}
                        >
                          Select Product
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && !isLoading && results.length === 0 && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No similar products found. Try adjusting the score threshold or using a different image.
            </AlertDescription>
          </Alert>
        )}

        {/* Initial State */}
        {!hasSearched && !previewImage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Upload an image or enter a URL to search for similar products in the inventory.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
