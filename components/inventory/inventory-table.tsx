"use client";

import { useState, useMemo } from "react";
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
import { Search, Filter, X } from "lucide-react";
import { InventoryDialog } from "./inventory-dialog";
import { ImageSearchDialog } from "./image-search";

import { deleteInventoryItem } from "@/lib/api";
import { canWrite, isManagerOrAdmin } from "@/lib/permissions";
import Image from "next/image";

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdate: () => void;
}

export function InventoryTable({ items, onUpdate }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

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
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
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
              <InventoryDialog
                item={editingItem}
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) setEditingItem(null);
                }}
                onSuccess={() => {
                  onUpdate();
                  handleDialogClose();
                }}
              />
            </div>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discount">Discount</option>
          </select>

          {/* Stock Level Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

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

          {/* Results Count */}
          <span className="ml-auto text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </span>
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
    </div>
  );
}
