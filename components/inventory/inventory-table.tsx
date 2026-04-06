"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, ChevronDown, Plus } from "lucide-react";
import { ImageSearchDialog } from "./image-search";
import { AddStockDialogControlled } from "./add-stock-dialog-controlled";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { deleteInventoryItem } from "@/lib/api";
import { canWrite, isManagerOrAdmin } from "@/lib/permissions";
import Image from "next/image";

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdate: () => void;
}

export function InventoryTable({ items, onUpdate }: InventoryTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [selectedItemForStock, setSelectedItemForStock] =
    useState<InventoryItem | null>(null);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);

  // Get unique categories from items
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean)),
    );
    return uniqueCategories.sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      // Status filter
      const matchesStatus =
        selectedStatus === "all" || item.status === selectedStatus;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = item.stock <= item.minStock;
      } else if (stockFilter === "in-stock") {
        matchesStock = item.stock > item.minStock;
      } else if (stockFilter === "out") {
        matchesStock = item.stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus, stockFilter]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    stockFilter !== "all";

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedStatus("all");
    setStockFilter("all");
  };

  const handleEdit = (item: InventoryItem) => {
    router.push(`/inventory/${item.id}/edit`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {canWrite() && (
            <div className="flex gap-2">
              <ImageSearchDialog />
              <Button
                onClick={() => router.push("/inventory/add")}
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* Filters Row */}
        <div className="space-y-3">
          {/* Filter Header */}
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-foreground">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-auto">
                {(selectedCategory !== "all" ? 1 : 0) +
                  (selectedStatus !== "all" ? 1 : 0) +
                  (stockFilter !== "all" ? 1 : 0)}{" "}
                active
              </Badge>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 ${
                    selectedCategory !== "all"
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      : ""
                  }`}>
                  <span className="text-xs font-medium">Category</span>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {selectedCategory}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSelectedCategory("all")}
                  className={selectedCategory === "all" ? "bg-blue-50" : ""}>
                  All Categories
                  {selectedCategory === "all" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={
                      selectedCategory === category ? "bg-blue-50" : ""
                    }>
                    {category}
                    {selectedCategory === category && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 ${
                    selectedStatus !== "all"
                      ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                      : ""
                  }`}>
                  <span className="text-xs font-medium">Status</span>
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {selectedStatus}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Select Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSelectedStatus("all")}
                  className={selectedStatus === "all" ? "bg-green-50" : ""}>
                  All Status
                  {selectedStatus === "all" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus("Active")}
                  className={selectedStatus === "Active" ? "bg-green-50" : ""}>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-green-200 bg-green-50 text-green-700">
                    Active
                  </Badge>
                  {selectedStatus === "Active" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus("Inactive")}
                  className={
                    selectedStatus === "Inactive" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-gray-200 bg-gray-50 text-gray-700">
                    Inactive
                  </Badge>
                  {selectedStatus === "Inactive" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus("Discount")}
                  className={
                    selectedStatus === "Discount" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-orange-200 bg-orange-50 text-orange-700">
                    Discount
                  </Badge>
                  {selectedStatus === "Discount" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Stock Level Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 ${
                    stockFilter !== "all"
                      ? "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                      : ""
                  }`}>
                  <span className="text-xs font-medium">Stock</span>
                  {stockFilter !== "all" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {stockFilter === "in-stock"
                        ? "In Stock"
                        : stockFilter === "low"
                          ? "Low"
                          : "Out"}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Select Stock Level</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setStockFilter("all")}
                  className={stockFilter === "all" ? "bg-purple-50" : ""}>
                  All Stock Levels
                  {stockFilter === "all" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStockFilter("in-stock")}
                  className={stockFilter === "in-stock" ? "bg-purple-50" : ""}>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-green-200 bg-green-50 text-green-700">
                    In Stock
                  </Badge>
                  {stockFilter === "in-stock" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStockFilter("low")}
                  className={stockFilter === "low" ? "bg-purple-50" : ""}>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-yellow-200 bg-yellow-50 text-yellow-700">
                    Low Stock
                  </Badge>
                  {stockFilter === "low" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStockFilter("out")}
                  className={stockFilter === "out" ? "bg-purple-50" : ""}>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-red-200 bg-red-50 text-red-700">
                    Out of Stock
                  </Badge>
                  {stockFilter === "out" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3 text-sm">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm min-w-[80px]">
                Image
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Name
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                SKU
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Category
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[100px]">
                Price
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[80px]">
                Stock
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[80px]">
                Sold
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[100px]">
                Status
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/50 transition-colors">
                  <TableCell className="py-2">
                    <div className="w-20 h-20 relative rounded overflow-hidden bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => handleEdit(item)}>
                      <div className="font-medium text-base">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-base py-2">
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => handleEdit(item)}>
                      {item.sku}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-base py-2 font-medium">
                    ${item.salePrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Badge
                      variant={
                        item.stock <= item.minStock ? "destructive" : "default"
                      }
                      className={`text-sm px-3 py-1 ${item.stock <= item.minStock ? "" : "bg-blue-600"}`}>
                      {item.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <span className="text-muted-foreground">0</span>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Badge
                      variant={
                        item.status === "Active"
                          ? "default"
                          : item.status === "Inactive"
                            ? "outline"
                            : item.status === "Discount"
                              ? "secondary"
                              : "destructive"
                      }
                      className={`text-sm px-3 py-1 ${
                        item.status === "Active"
                          ? "bg-green-600"
                          : item.status === "Inactive"
                            ? "bg-yellow-500"
                            : item.status === "Discount"
                              ? "bg-red-600 text-white"
                              : "bg-red-600"
                      }`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {canWrite() && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            setSelectedItemForStock(item);
                            setIsAddStockDialogOpen(true);
                          }}>
                          Add Stock
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (
                              confirm(
                                "Are you sure you want to delete this item?",
                              )
                            ) {
                              try {
                                await deleteInventoryItem(item.id);
                                onUpdate();
                              } catch (error) {
                                console.error("Error deleting item:", error);
                              }
                            }
                          }}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedItemForStock && (
        <AddStockDialogControlled
          item={selectedItemForStock}
          open={isAddStockDialogOpen}
          onOpenChange={setIsAddStockDialogOpen}
          onSuccess={() => {
            setIsAddStockDialogOpen(false);
            setSelectedItemForStock(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
