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
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Transaction {
  transactionId: number;
  invoice: number;
  customer: number | null;
  customerName?: string;
  amountPaid: string;
  paymentMethod: string;
  transactionStatus: string;
  paymentReference: string | null;
  transactionDate: string;
  recordedByUser: number | null;
  recordedByUsername?: string;
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/transactions/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.paymentReference
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.customerName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.transactionId.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        transaction.transactionStatus === statusFilter;
      const matchesPaymentMethod =
        paymentMethodFilter === "all" ||
        transaction.paymentMethod === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesPaymentMethod;
    });
  }, [transactions, searchTerm, statusFilter, paymentMethodFilter]);

  const hasActiveFilters =
    statusFilter !== "all" || paymentMethodFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setPaymentMethodFilter("all");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-green-50 text-green-700 border-green-200";
      case "Card":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "KHQR":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "BankTransfer":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID, reference, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="space-y-3">
          {/* Filter Header */}
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-foreground">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-auto">
                {(statusFilter !== "all" ? 1 : 0) +
                  (paymentMethodFilter !== "all" ? 1 : 0)}{" "}
                active
              </Badge>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 ${
                    statusFilter !== "all"
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      : ""
                  }`}>
                  <span className="text-xs font-medium">Status</span>
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {statusFilter}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuLabel>Select Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-blue-50" : ""}>
                  All Status
                  {statusFilter === "all" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("Completed")}
                  className={statusFilter === "Completed" ? "bg-blue-50" : ""}>
                  <Badge className="mr-2 bg-green-100 text-green-800">
                    Completed
                  </Badge>
                  {statusFilter === "Completed" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("Pending")}
                  className={statusFilter === "Pending" ? "bg-blue-50" : ""}>
                  <Badge className="mr-2 bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                  {statusFilter === "Pending" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("Failed")}
                  className={statusFilter === "Failed" ? "bg-blue-50" : ""}>
                  <Badge className="mr-2 bg-red-100 text-red-800">Failed</Badge>
                  {statusFilter === "Failed" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("Refunded")}
                  className={statusFilter === "Refunded" ? "bg-blue-50" : ""}>
                  <Badge className="mr-2 bg-blue-100 text-blue-800">
                    Refunded
                  </Badge>
                  {statusFilter === "Refunded" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Payment Method Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 ${
                    paymentMethodFilter !== "all"
                      ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                      : ""
                  }`}>
                  <span className="text-xs font-medium">Payment Method</span>
                  {paymentMethodFilter !== "all" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {paymentMethodFilter}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Select Payment Method</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("all")}
                  className={
                    paymentMethodFilter === "all" ? "bg-green-50" : ""
                  }>
                  All Payment Methods
                  {paymentMethodFilter === "all" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("Cash")}
                  className={
                    paymentMethodFilter === "Cash" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full bg-green-50 border-green-200 text-green-700">
                    Cash
                  </Badge>
                  {paymentMethodFilter === "Cash" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("Card")}
                  className={
                    paymentMethodFilter === "Card" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full bg-blue-50 border-blue-200 text-blue-700">
                    Card
                  </Badge>
                  {paymentMethodFilter === "Card" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("KHQR")}
                  className={
                    paymentMethodFilter === "KHQR" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full bg-purple-50 border-purple-200 text-purple-700">
                    KHQR
                  </Badge>
                  {paymentMethodFilter === "KHQR" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("BankTransfer")}
                  className={
                    paymentMethodFilter === "BankTransfer" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full bg-indigo-50 border-indigo-200 text-indigo-700">
                    Bank Transfer
                  </Badge>
                  {paymentMethodFilter === "BankTransfer" && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("Other")}
                  className={
                    paymentMethodFilter === "Other" ? "bg-green-50" : ""
                  }>
                  <Badge
                    variant="outline"
                    className="mr-2 h-5 rounded-full bg-gray-50 border-gray-200 text-gray-700">
                    Other
                  </Badge>
                  {paymentMethodFilter === "Other" && (
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
              <span className="font-semibold">
                {filteredTransactions.length}
              </span>{" "}
              of <span className="font-semibold">{transactions.length}</span>{" "}
              transactions
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600">
                {transactions.length - filteredTransactions.length} filtered out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.transactionId}>
                  <TableCell className="font-mono">
                    TXN-{transaction.transactionId}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {transaction.customerName ||
                      `Customer #${transaction.customer}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPaymentMethodColor(
                        transaction.paymentMethod,
                      )}>
                      {transaction.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${parseFloat(transaction.amountPaid).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {transaction.paymentReference || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(transaction.transactionStatus)}>
                      {transaction.transactionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {transaction.recordedByUsername || "-"}
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
