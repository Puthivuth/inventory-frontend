"use client"

import { useEffect, useState } from "react"
import { getProductAssociations } from "@/lib/api"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AssociatedProductsProps {
  productId: string
}

export function AssociatedProducts({ productId }: AssociatedProductsProps) {
  const [associatedProducts, setAssociatedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAssociatedProducts() {
      if (!productId) return
      try {
        setIsLoading(true)
        const products = await getProductAssociations(productId)
        setAssociatedProducts(products)
      } catch (error) {
        console.error("Error fetching associated products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssociatedProducts()
  }, [productId])

  if (isLoading) {
    return <div>Loading associated products...</div>
  }

  if (associatedProducts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Bought Together</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {associatedProducts.map((product) => (
            <div key={product.productId} className="border rounded-lg p-2">
              <div className="relative w-full h-24 bg-muted rounded overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="font-medium text-sm">{product.productName}</p>
                <p className="text-sm text-muted-foreground">
                  ${parseFloat(product.salePrice).toFixed(2)}
                  {product.association_percentage !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {parseFloat(product.association_percentage).toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
