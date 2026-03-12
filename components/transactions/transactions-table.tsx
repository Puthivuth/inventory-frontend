"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Transaction {
  transactionId: number
  invoice: number
  customer: number | null
  customerName?: string
  amountPaid: string
  paymentMethod: string
  transactionStatus: string
  paymentReference: string | null
  transactionDate: string
  recordedByUser: number | null
  recordedByUsername?: string
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/transactions/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        console.error("Failed to fetch transactions")
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.transactionId.toString().includes(searchTerm)

      const matchesStatus = statusFilter === "all" || transaction.transactionStatus === statusFilter
      const matchesPaymentMethod = paymentMethodFilter === "all" || transaction.paymentMethod === paymentMethodFilter

      return matchesSearch && matchesStatus && matchesPaymentMethod
    })
  }, [transactions, searchTerm, statusFilter, paymentMethodFilter])

  const hasActiveFilters = statusFilter !== "all" || paymentMethodFilter !== "all"

  const clearFilters = () => {
    setStatusFilter("all")
    setPaymentMethodFilter("all")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Failed":
        return "bg-red-100 text-red-800"
      case "Refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-green-50 text-green-700 border-green-200"
      case "Card":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "KHQR":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "BankTransfer":
        return "bg-indigo-50 text-indigo-700 border-indigo-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="KHQR">KHQR</option>
            <option value="BankTransfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3 text-sm">
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}

          {/* Results Count */}
          <span className="ml-auto text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
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
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.transactionId}>
                  <TableCell className="font-mono">TXN-{transaction.transactionId}</TableCell>
                  <TableCell>{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.customerName || `Customer #${transaction.customer}`}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPaymentMethodColor(transaction.paymentMethod)}>
                      {transaction.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">${parseFloat(transaction.amountPaid).toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {transaction.paymentReference || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.transactionStatus)}>
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
  )
}
