"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  X,
  Plus,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CustomerDialog } from "./customer-dialog";
import { canWrite } from "@/lib/permissions";

interface Customer {
  customerId: number;
  name: string;
  businessAddress: string;
  phone: string;
  email: string | null;
  customerType: string;
  firstPurchaseDate: string | null;
  createdAt: string;
}

interface CustomersTableProps {
  onRefresh?: () => void;
}

export function CustomersTable({ onRefresh }: CustomersTableProps = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/customers/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Sort by createdAt descending (newest first)
        const sortedData = data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setCustomers(sortedData);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (customerId: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/customers/${customerId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error deleting customer");
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.businessAddress
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" || customer.customerType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, typeFilter]);

  const hasActiveFilters = typeFilter !== "all";

  const clearFilters = () => {
    setTypeFilter("all");
  };

  const getCustomerTypeColor = (type: string) => {
    return type === "Business"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {canWrite() && (
            <Button
              onClick={() => {
                setEditingCustomer(null);
                setIsDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
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
                1 active
              </Badge>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Customer Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 ${
                    typeFilter !== "all"
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      : ""
                  }`}>
                  <span className="text-xs font-medium">Customer Type</span>
                  {typeFilter !== "all" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {typeFilter}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuLabel>Select Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTypeFilter("all")}
                  className={typeFilter === "all" ? "bg-blue-50" : ""}>
                  All Types
                  {typeFilter === "all" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTypeFilter("Individual")}
                  className={typeFilter === "Individual" ? "bg-blue-50" : ""}>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-green-200 bg-green-50 text-green-700">
                    Individual
                  </Badge>
                  {typeFilter === "Individual" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTypeFilter("Business")}
                  className={typeFilter === "Business" ? "bg-blue-50" : ""}>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full border-blue-200 bg-blue-50 text-blue-700">
                    Business
                  </Badge>
                  {typeFilter === "Business" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">
                <X className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>
              Showing{" "}
              <span className="font-semibold">{filteredCustomers.length}</span>{" "}
              of <span className="font-semibold">{customers.length}</span>{" "}
              customers
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600">
                {customers.length - filteredCustomers.length} filtered out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">
                Customer Name
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Type
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[180px]">
                Contact
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[200px]">
                Address
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[120px]">
                First Purchase
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Added On
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[100px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.customerId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setEditingCustomer(customer);
                    setIsDialogOpen(true);
                  }}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={getCustomerTypeColor(customer.customerType)}>
                      {customer.customerType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {customer.businessAddress}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.firstPurchaseDate ? (
                      new Date(customer.firstPurchaseDate).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canWrite() && (
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsDialogOpen(true);
                          }}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(customer.customerId)}>
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

      <CustomerDialog
        customer={editingCustomer}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          fetchCustomers();
          setIsDialogOpen(false);
          setEditingCustomer(null);
        }}
      />
    </div>
  );
}
