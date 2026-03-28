import type { InventoryItem, SalesData } from "@/types";
import {
  getInvoices,
  getInventoryItems,
  getPurchaseOrders,
  getSuppliers,
} from "./api";

export const calculateSalesData = async (): Promise<SalesData[]> => {
  const invoices = await getInvoices();
  const salesMap = new Map<string, SalesData>();

  invoices.forEach((invoice) => {
    if (invoice.status?.toLowerCase() === "paid") {
      invoice.items.forEach((item: any) => {
        const existing = salesMap.get(item.inventoryItemId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.total;
          existing.invoiceCount += 1;
        } else {
          salesMap.set(item.inventoryItemId, {
            itemId: item.inventoryItemId,
            itemName: item.name,
            totalQuantity: item.quantity,
            totalRevenue: item.total,
            invoiceCount: 1,
          });
        }
      });
    }
  });

  return Array.from(salesMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );
};

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  const items = await getInventoryItems();
  return items
    .filter((item) => item.stock <= item.minStock)
    .sort((a, b) => a.stock - b.stock);
};

export const calculateRevenueByDate = async (): Promise<
  { date: string; revenue: number; invoices: number }[]
> => {
  const invoices = await getInvoices();
  const paidInvoices = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "paid",
  );
  const revenueMap = new Map<string, { revenue: number; invoices: number }>();

  paidInvoices.forEach((invoice) => {
    const date = new Date(invoice.createdAt).toLocaleDateString();
    const existing = revenueMap.get(date);
    if (existing) {
      existing.revenue += invoice.total;
      existing.invoices += 1;
    } else {
      revenueMap.set(date, { revenue: invoice.total, invoices: 1 });
    }
  });

  return Array.from(revenueMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const calculateTotalStats = async () => {
  const invoices = await getInvoices();
  const items = await getInventoryItems();

  const totalProducts = items.length;
  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = items.filter(
    (item) => item.stock <= item.minStock,
  ).length;
  const outOfStockCount = items.filter((item) => item.stock === 0).length;
  const inventoryValue = items.reduce((sum, item) => {
    return sum + item.salePrice * item.stock;
  }, 0);

  return {
    totalProducts,
    totalStock,
    lowStockCount,
    outOfStockCount,
    inventoryValue,
  };
};

export const calculateRestockPredictions = async () => {
  const items = await getInventoryItems();
  const invoices = await getInvoices();

  // Calculate average daily sales for each product
  const salesVelocity = new Map<
    string,
    { totalSold: number; daysCounted: number }
  >();

  // Get date range from invoices
  const dates = invoices.map((inv) => new Date(inv.createdAt).getTime());
  const oldestDate = Math.min(...dates);
  const newestDate = Math.max(...dates);
  const daysCovered = Math.max(
    1,
    Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)),
  );

  // Calculate total sold per product
  invoices.forEach((invoice) => {
    if (invoice.status?.toLowerCase() === "paid") {
      invoice.items.forEach((item: any) => {
        const existing = salesVelocity.get(item.inventoryItemId);
        if (existing) {
          existing.totalSold += item.quantity;
        } else {
          salesVelocity.set(item.inventoryItemId, {
            totalSold: item.quantity,
            daysCounted: daysCovered,
          });
        }
      });
    }
  });

  // Calculate restock predictions
  return items.map((item) => {
    const velocity = salesVelocity.get(item.id);
    const avgDailySales = velocity
      ? velocity.totalSold / velocity.daysCounted
      : 0;
    const daysUntilStockout =
      avgDailySales > 0 ? Math.floor(item.stock / avgDailySales) : 999;

    return {
      ...item,
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      daysUntilStockout,
      needsRestock: daysUntilStockout < 30 || item.stock <= item.minStock,
    };
  });
};

export const calculateSupplierAnalytics = async () => {
  // 1. Fetch all necessary raw data
  const suppliers = await getSuppliers();
  const inventoryItems = await getInventoryItems();
  const invoices = await getInvoices();

  // 2. Create a lookup map for inventory items to quickly find their supplier
  const inventoryItemMap = new Map<string, InventoryItem>();
  inventoryItems.forEach((item) => inventoryItemMap.set(item.id, item));

  // 3. Create a stats map for all suppliers
  const supplierStats = new Map<
    string,
    {
      name: string;
      totalOrders: number; // Represents number of sales transactions
      totalSpend: number; // Represents total REVENUE from sales
      lastOrderDate?: string; // Represents last SALE date
    }
  >();

  if (!suppliers) return [];

  suppliers.forEach((s) => {
    supplierStats.set(s.id, {
      name: s.name,
      totalOrders: 0,
      totalSpend: 0,
      lastOrderDate: undefined,
    });
  });

  // 4. Process paid invoices
  const paidInvoices = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "paid",
  );
  paidInvoices.forEach((invoice) => {
    invoice.items.forEach((lineItem: any) => {
      // Find the inventory item for this line item
      const inventoryItem = inventoryItemMap.get(lineItem.inventoryItemId);
      if (inventoryItem && inventoryItem.sourceId) {
        // Find the supplier for this inventory item
        const supplierStat = supplierStats.get(inventoryItem.sourceId);
        if (supplierStat) {
          supplierStat.totalOrders += 1;
          supplierStat.totalSpend += lineItem.total; // Add the revenue from this sale

          if (
            !supplierStat.lastOrderDate ||
            invoice.createdAt > supplierStat.lastOrderDate
          ) {
            supplierStat.lastOrderDate = invoice.createdAt;
          }
        }
      }
    });
  });

  // 5. Convert to array and sort
  return Array.from(supplierStats.entries())
    .map(([id, stats]) => {
      return {
        supplierId: id,
        ...stats,
        reliability: 100,
        receivedOrders: stats.totalOrders,
        pendingOrders: 0,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend); // Sort by highest revenue
};

export const getTopSuppliers = async (limit = 5) => {
  const analytics = await calculateSupplierAnalytics();
  return analytics.slice(0, limit);
};

export const calculateProfitAnalytics = async () => {
  const invoices = await getInvoices();
  const items = await getInventoryItems();

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let profitByProduct: Record<
    string,
    {
      name: string;
      revenue: number;
      cost: number;
      profit: number;
      units: number;
    }
  > = {};

  // Process paid invoices
  invoices
    .filter((inv) => inv.status?.toLowerCase() === "paid")
    .forEach((invoice) => {
      invoice.items.forEach((invoiceItem: any) => {
        const inventoryItem = items.find(
          (item) => item.productId === invoiceItem.inventoryItemId,
        );
        if (!inventoryItem) return;

        const quantity = invoiceItem.quantity;
        const revenue = invoiceItem.total;
        const costPrice = inventoryItem.costPrice || 0;
        const costTotal = costPrice * quantity;
        const profit = revenue - costTotal;

        totalRevenue += revenue;
        totalCost += costTotal;
        totalProfit += profit;

        if (!profitByProduct[inventoryItem.id]) {
          profitByProduct[inventoryItem.id] = {
            name: inventoryItem.name,
            revenue: 0,
            cost: 0,
            profit: 0,
            units: 0,
          };
        }

        profitByProduct[inventoryItem.id].revenue += revenue;
        profitByProduct[inventoryItem.id].cost += costTotal;
        profitByProduct[inventoryItem.id].profit += profit;
        profitByProduct[inventoryItem.id].units += quantity;
      });
    });

  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const topProfitableProducts = Object.values(profitByProduct)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin,
    topProfitableProducts,
  };
};
