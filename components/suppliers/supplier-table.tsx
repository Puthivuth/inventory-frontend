"use client";

import { useState, useMemo } from "react";
import type { Supplier } from "@/types";
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
import { Search, Mail, Phone, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupplierDialog } from "./supplier-dialog";
import { SupplierDetailDialog } from "./supplier-detail-dialog";
import { deleteSupplier } from "@/lib/api";
import { canWrite } from "@/lib/permissions";

interface SupplierTableProps {
  suppliers: Supplier[];
  onUpdate: () => void;
}

export function SupplierTable({ suppliers, onUpdate }: SupplierTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Get unique subcategories for filter
  const availableSubcategories = useMemo(
    () =>
      Array.from(
        new Set(
          suppliers
            .flatMap((supplier) => supplier.subcategories || [])
            .filter(Boolean),
        ),
      ).sort(),
    [suppliers],
  );

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // Search filter
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Subcategory filter
      const matchesSubcategory =
        subcategoryFilter === "all" ||
        (supplier.subcategories || []).includes(subcategoryFilter);

      return matchesSearch && matchesSubcategory;
    });
  }, [suppliers, searchTerm, subcategoryFilter]);

  const hasActiveFilters = subcategoryFilter !== "all";

  const clearFilters = () => {
    setSubcategoryFilter("all");
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      await deleteSupplier(id);
      onUpdate();
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact person, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {canWrite() && (
          <SupplierDialog
            supplier={editingSupplier}
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingSupplier(null);
            }}
            onSuccess={() => {
              onUpdate();
              handleDialogClose();
            }}
          />
        )}
      </div>

      {/* Filters Row */}
      <div className="space-y-3">
        {/* Filter Header */}
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-foreground">Filters</span>
          {hasActiveFilters && (
            <>
              <Badge variant="secondary" className="ml-auto">
                1 active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs">
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Sub-Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 gap-2 ${
                  subcategoryFilter !== "all"
                    ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                    : ""
                }`}>
                <span className="text-xs font-medium">Sub-Category</span>
                {subcategoryFilter !== "all" && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                    {subcategoryFilter}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Select Sub-Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSubcategoryFilter("all")}
                className={subcategoryFilter === "all" ? "bg-blue-50" : ""}>
                All Sub-Categories
                {subcategoryFilter === "all" && (
                  <span className="ml-auto">✓</span>
                )}
              </DropdownMenuItem>
              {availableSubcategories.map((subcategory) => (
                <DropdownMenuItem
                  key={subcategory}
                  onClick={() => setSubcategoryFilter(subcategory)}
                  className={
                    subcategoryFilter === subcategory ? "bg-blue-50" : ""
                  }>
                  {subcategory}
                  {subcategoryFilter === subcategory && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">
                Supplier Name
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">
                Contact Person
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[180px]">
                Contact Info
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[200px]">
                Address
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[200px]">
                Sub-Categories Supplied
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[140px]">
                Last Transaction
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setViewingSupplier(supplier);
                    setIsDetailDialogOpen(true);
                  }}>
                  <TableCell className="py-2">
                    <div className="font-medium text-base">{supplier.name}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="text-base">
                      {supplier.contactPerson || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {!supplier.email && !supplier.phone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="text-sm max-w-xs truncate">
                      {supplier.address || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {(supplier.subcategories || []).length > 0 ? (
                        (supplier.subcategories || []).map((subcat) => (
                          <Badge
                            key={subcat}
                            variant="outline"
                            className="text-xs">
                            {subcat}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-sm">
                      {formatDate(supplier.lastTransactionDate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {canWrite() && (
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}>
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

      {/* Supplier Detail Dialog */}
      <SupplierDetailDialog
        supplier={viewingSupplier}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}
