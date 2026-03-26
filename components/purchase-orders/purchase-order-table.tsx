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
  Trash2,
  CheckCircle,
  FileText,
  RefreshCw,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseOrderDialog } from "./purchase-order-dialog";
import { InvoiceGenerator } from "./invoice-generator";
import { getInvoices } from "@/lib/api";
import { canWrite } from "@/lib/permissions";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  paidAt: string | null;
  items: any[];
  // Fields from the old raw fetch that may or may not be on the new object
  invoiceId?: number;
  grandTotal?: string;
  createdByUsername?: string;
  khqrMd5?: string | null;
}

export function PurchaseOrderTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceGeneratorOpen, setIsInvoiceGeneratorOpen] = useState(false);
  const [invoiceToGenerate, setInvoiceToGenerate] = useState<Invoice | null>(
    null,
  );
  const [checkingPayments, setCheckingPayments] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Check payment status for pending KHQR invoices when page loads
  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      checkPendingPayments();
    }
  }, [isLoading, invoices]);

  const fetchInvoices = async () => {
    try {
      setError(null);
      const data = await getInvoices();
      // Sort by createdAt descending (newest first)
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setInvoices(sortedData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load invoices. Make sure you are logged in.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPendingPayments = async () => {
    // Find all pending KHQR invoices with MD5 hash
    const pendingKHQRInvoices = invoices.filter(
      (inv) =>
        inv.status === "pending" && inv.paymentMethod === "KHQR" && inv.khqrMd5,
    );

    if (pendingKHQRInvoices.length === 0) {
      return;
    }

    // Check each pending invoice
    for (const invoice of pendingKHQRInvoices) {
      if (invoice.invoiceId) {
        await checkSinglePayment(invoice.invoiceId);
      }
    }
  };

  const checkSinglePayment = async (invoiceId: number) => {
    if (checkingPayments.has(invoiceId)) {
      return; // Already checking this invoice
    }

    setCheckingPayments((prev) => new Set(prev).add(invoiceId));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/invoices/${invoiceId}/check_payment/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const result = await response.json();

        if (result.paid) {
          console.log(`✅ Payment confirmed for invoice #${invoiceId}!`);
          // Refresh invoices to show updated status
          fetchInvoices();
        } else {
          console.log(`⏳ Payment not yet received for invoice #${invoiceId}`);
        }
      } else {
        console.error(`❌ Failed to check payment for invoice #${invoiceId}`);
      }
    } catch (error) {
      console.error(
        `❌ Error checking payment for invoice #${invoiceId}:`,
        error,
      );
    } finally {
      setCheckingPayments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!invoice.invoiceId) return;
    if (!confirm(`Mark order ${invoice.invoiceNumber} as paid?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/invoices/${invoice.invoiceId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Paid" }),
        },
      );

      if (response.ok) {
        fetchInvoices();
        alert("Order marked as paid and transaction recorded!");
      } else {
        alert("Failed to mark order as paid");
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Error marking as paid");
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!invoice.invoiceId) return;
    if (!confirm(`Cancel order ${invoice.invoiceNumber}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/invoices/${invoice.invoiceId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Cancelled" }),
        },
      );

      if (response.ok) {
        fetchInvoices();
        alert("Order cancelled successfully!");
      } else {
        alert("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Error cancelling order");
    }
  };

  const handleDelete = async (invoiceId: number | undefined) => {
    if (!invoiceId) return;
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/invoices/${invoiceId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (response.ok || response.status === 204) {
        fetchInvoices();
      } else {
        alert("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order");
    }
  };

  const handleViewInvoice = async (invoiceId: number | undefined) => {
    if (!invoiceId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/invoices/${invoiceId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (response.ok) {
        const invoiceData = await response.json();
        setSelectedInvoice(invoiceData);
        setIsDialogOpen(true);
      } else {
        alert("Failed to load invoice details");
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      alert("Error loading invoice");
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        invoice.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const hasActiveFilters = statusFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Error Loading Orders</h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
            <Button
              onClick={() => fetchInvoices()}
              size="sm"
              className="mt-3 bg-red-600 hover:bg-red-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Payment checking notification */}
      {checkingPayments.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-800">
            Checking payment status for {checkingPayments.size} invoice
            {checkingPayments.size > 1 ? "s" : ""}...
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {canWrite() && (
            <Button
              onClick={() => {
                setSelectedInvoice(null);
                setIsDialogOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
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
            Showing {filteredInvoices.length} of {invoices.length} orders
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Order ID
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[120px]">
                Created Date
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[150px]">
                Customer
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Payment
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[100px]">
                Total
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[100px]">
                Status
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[120px]">
                Paid At
              </TableHead>
              <TableHead className="text-xs sm:text-sm min-w-[120px]">
                Created By
              </TableHead>
              <TableHead className="text-right text-xs sm:text-sm min-w-[150px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-40" />
                    <div>
                      {invoices.length === 0 ? (
                        <>
                          <p className="font-medium">No orders yet</p>
                          <p className="text-xs">
                            Create your first purchase order to get started
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">
                            No orders match your filters
                          </p>
                          <p className="text-xs">
                            Try adjusting your search or status filter
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewInvoice(invoice.invoiceId)}>
                  <TableCell className="font-mono">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {invoice.customerName}
                      </span>
                      {invoice.customerPhone && (
                        <span className="text-xs text-muted-foreground">
                          {invoice.customerPhone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 text-xs">
                      {invoice.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${invoice.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      {invoice.invoiceId &&
                        checkingPayments.has(invoice.invoiceId) && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-600 text-xs animate-pulse">
                            Checking...
                          </Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.paidAt ? (
                      <div className="flex flex-col text-sm">
                        <span className="font-medium text-green-700">
                          {new Date(invoice.paidAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(invoice.paidAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.createdByUsername || "-"}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}>
                      {invoice.status?.toLowerCase() === "pending" &&
                        invoice.paymentMethod === "KHQR" &&
                        invoice.invoiceId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              checkSinglePayment(invoice.invoiceId!)
                            }
                            title="Check payment status"
                            className="text-blue-600 hover:text-blue-700"
                            disabled={checkingPayments.has(invoice.invoiceId)}>
                            <RefreshCw
                              className={`h-4 w-4 ${
                                invoice.invoiceId &&
                                checkingPayments.has(invoice.invoiceId)
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </Button>
                        )}
                      {invoice.status?.toLowerCase() === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsPaid(invoice)}
                            title="Mark as paid"
                            className="text-green-600 hover:text-green-700">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvoice(invoice)}
                            title="Cancel order"
                            className="text-red-600 hover:text-red-700">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // @ts-ignore
                          setInvoiceToGenerate(invoice);
                          setIsInvoiceGeneratorOpen(true);
                        }}
                        title="Generate invoice"
                        className="text-blue-600 hover:text-blue-700">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {canWrite() && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.invoiceId)}
                          title="Delete order">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseOrderDialog
        // @ts-ignore
        invoice={selectedInvoice}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          fetchInvoices();
          setIsDialogOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {isInvoiceGeneratorOpen && invoiceToGenerate && (
        <InvoiceGenerator
          // @ts-ignore
          invoice={invoiceToGenerate}
          onClose={() => {
            setIsInvoiceGeneratorOpen(false);
            setInvoiceToGenerate(null);
          }}
        />
      )}
    </div>
  );
}
