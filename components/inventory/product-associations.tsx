"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface AssociatedProduct {
  productId: number;
  productName: string;
  description: string;
  image: string | null;
  skuCode: string;
  salePrice: string | number;
  associationPercentage: string | number;
  frequency: number;
}

interface ProductAssociationsProps {
  productId: number;
  productName: string;
}

export function ProductAssociations({
  productId,
  productName,
}: ProductAssociationsProps) {
  const [products, setProducts] = useState<AssociatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000"}/api/product-associations/by_product/?product_id=${productId}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Token ${token}` } : {}),
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product associations");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchAssociations();
    }
  }, [productId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usually Bought Together</CardTitle>
          <CardDescription>
            Products frequently purchased with {productName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usually Bought Together</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usually Bought Together</CardTitle>
          <CardDescription>
            Products frequently purchased with {productName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-gray-500">
              No associated products found yet. This product will appear here
              once it&apos;s purchased together with other products.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Usually Bought Together</CardTitle>
        <CardDescription>
          Products frequently purchased with {productName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.productId}
              className="flex items-start gap-4 rounded-lg border p-4 hover:bg-gray-50 transition-colors">
              {/* Product Image */}
              {product.image && (
                <div className="flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.productName}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                </div>
              )}

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {product.productName}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  SKU: {product.skuCode}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    $
                    {typeof product.salePrice === "string"
                      ? product.salePrice
                      : product.salePrice.toFixed(2)}
                  </Badge>
                  {Number(product.associationPercentage) > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-800 border-blue-200">
                      {Math.min(
                        Number(product.associationPercentage),
                        100,
                      ).toFixed(1)}
                      % bought together
                    </Badge>
                  )}
                  {product.frequency > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-800 border-green-200">
                      {product.frequency} times
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
