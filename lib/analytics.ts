import type { InventoryItem, SalesData } from "@/types"
import { getInvoices, getInventoryItems, getPurchaseOrders, getSuppliers } from "./api"

export const calculateSalesData = async (): Promise<SalesData[]> => {
  const invoices = await getInvoices()
  const salesMap = new Map<string, SalesData>()

  invoices.forEach((invoice) => {
    if (invoice.status === "paid") {
      invoice.items.forEach((item: any) => {
        const existing = salesMap.get(item.inventoryItemId)
        if (existing) {
          existing.totalQuantity += item.quantity
          existing.totalRevenue += item.total
          existing.invoiceCount += 1
        } else {
          salesMap.set(item.inventoryItemId, {
            itemId: item.inventoryItemId,
            itemName: item.name,
            totalQuantity: item.quantity,
            totalRevenue: item.total,
            invoiceCount: 1,
          })
        }
      })
    }
  })

  return Array.from(salesMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  const items = await getInventoryItems()
  return items.filter((item) => item.stock <= item.minStock).sort((a, b) => a.stock - b.stock)
}

export const calculateRevenueByDate = async (): Promise<{ date: string; revenue: number; invoices: number }[]> => {
  const invoices = await getInvoices()
  const paidInvoices = invoices.filter((inv) => inv.status === "paid")
  const revenueMap = new Map<string, { revenue: number; invoices: number }>()

  paidInvoices.forEach((invoice) => {
    const date = new Date(invoice.createdAt).toLocaleDateString()
    const existing = revenueMap.get(date)
    if (existing) {
      existing.revenue += invoice.total
      existing.invoices += 1
    } else {
      revenueMap.set(date, { revenue: invoice.total, invoices: 1 })
    }
  })

  return Array.from(revenueMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export const calculateTotalStats = async () => {
  const invoices = await getInvoices()
  const items = await getInventoryItems()

  const totalRevenue = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0)

  const totalInvoices = invoices.filter((inv) => inv.status === "paid").length
  const totalProducts = items.length
  const lowStockCount = items.filter((item) => item.stock <= item.minStock).length

  return {
    totalRevenue,
    totalInvoices,
    totalProducts,
    lowStockCount,
  }
}

export const calculateRestockPredictions = async () => {
  const items = await getInventoryItems()
  const invoices = await getInvoices()

  // Calculate average daily sales for each product
  const salesVelocity = new Map<string, { totalSold: number; daysCounted: number }>()

  // Get date range from invoices
  const dates = invoices.map((inv) => new Date(inv.createdAt).getTime())
  const oldestDate = Math.min(...dates)
  const newestDate = Math.max(...dates)
  const daysCovered = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)))

  // Calculate total sold per product
  invoices.forEach((invoice) => {
    if (invoice.status === "paid") {
      invoice.items.forEach((item: any) => {
        const existing = salesVelocity.get(item.inventoryItemId)
        if (existing) {
          existing.totalSold += item.quantity
        } else {
          salesVelocity.set(item.inventoryItemId, { totalSold: item.quantity, daysCounted: daysCovered })
        }
      })
    }
  })

  // Calculate restock predictions
  return items.map((item) => {
    const velocity = salesVelocity.get(item.id)
    const avgDailySales = velocity ? velocity.totalSold / velocity.daysCounted : 0
    const daysUntilStockout = avgDailySales > 0 ? Math.floor(item.stock / avgDailySales) : 999

    return {
      ...item,
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      daysUntilStockout,
      needsRestock: daysUntilStockout < 30 || item.stock <= item.minStock,
    }
  })
}

export const calculateSupplierAnalytics = async () => {
  const suppliers = await getSuppliers()
  const purchaseOrders = await getPurchaseOrders()

  const supplierStats = new Map<
    string,
    {
      name: string
      totalOrders: number
      totalSpend: number
      receivedOrders: number
      pendingOrders: number
      cancelledOrders: number
      lastOrderDate?: string
    }
  >()

  // Calculate stats for each supplier
  purchaseOrders.forEach((po) => {
    const existing = supplierStats.get(po.supplierId)
    if (existing) {
      existing.totalOrders += 1
      existing.totalSpend += po.totalAmount
      if (po.status === "received") existing.receivedOrders += 1
      if (po.status === "pending") existing.pendingOrders += 1
      if (po.status === "cancelled") existing.cancelledOrders += 1
      if (!existing.lastOrderDate || po.orderDate > existing.lastOrderDate) {
        existing.lastOrderDate = po.orderDate
      }
    } else {
      supplierStats.set(po.supplierId, {
        name: po.supplierName || "Unknown",
        totalOrders: 1,
        totalSpend: po.totalAmount,
        receivedOrders: po.status === "received" ? 1 : 0,
        pendingOrders: po.status === "pending" ? 1 : 0,
        cancelledOrders: po.status === "cancelled" ? 1 : 0,
        lastOrderDate: po.orderDate,
      })
    }
  })

  // Calculate reliability (percentage of orders received vs total)
  return Array.from(supplierStats.entries())
    .map(([id, stats]) => ({
      supplierId: id,
      ...stats,
      reliability: stats.totalOrders > 0 ? Math.round((stats.receivedOrders / stats.totalOrders) * 100) : 0,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)
}

export const getTopSuppliers = async (limit = 5) => {
  const analytics = await calculateSupplierAnalytics()
  return analytics.slice(0, limit)
}

export const calculateProfitAnalytics = async () => {
  const invoices = await getInvoices()
  const items = await getInventoryItems()

  let totalRevenue = 0
  let totalCost = 0
  let totalProfit = 0
  let profitByProduct: Record<string, { name: string; revenue: number; cost: number; profit: number; units: number }> = {}

  // Process paid invoices
  invoices.filter(inv => inv.status === "paid").forEach(invoice => {
    invoice.items.forEach((invoiceItem: any) => {
      const inventoryItem = items.find(item => item.productId === invoiceItem.inventoryItemId)
      if (!inventoryItem) return

      const quantity = invoiceItem.quantity
      const revenue = invoiceItem.total
      const costPrice = inventoryItem.costPrice || 0
      const costTotal = costPrice * quantity
      const profit = revenue - costTotal

      totalRevenue += revenue
      totalCost += costTotal
      totalProfit += profit

      if (!profitByProduct[inventoryItem.id]) {
        profitByProduct[inventoryItem.id] = {
          name: inventoryItem.name,
          revenue: 0,
          cost: 0,
          profit: 0,
          units: 0
        }
      }

      profitByProduct[inventoryItem.id].revenue += revenue
      profitByProduct[inventoryItem.id].cost += costTotal
      profitByProduct[inventoryItem.id].profit += profit
      profitByProduct[inventoryItem.id].units += quantity
    })
  })

  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const topProfitableProducts = Object.values(profitByProduct)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin,
    topProfitableProducts
  }
}
