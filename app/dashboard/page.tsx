"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getInventoryItems } from "@/lib/api";
import {
  calculateSalesData,
  getLowStockItems,
  calculateRevenueByDate,
  calculateTotalStats,
  calculateSupplierAnalytics,
  calculateRestockPredictions,
} from "@/lib/analytics";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TopProducts } from "@/components/dashboard/top-products";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import {
  BarChart3,
  Menu,
  Package,
  TrendingUp,
  DollarSign,
  Truck,
  Users,
} from "lucide-react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Button } from "@/components/ui/button";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { CategoryDistribution } from "@/components/dashboard/sub-category-distribution";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SupplierAnalytics } from "@/components/dashboard/supplier-analytics";
import { RestockAlerts } from "@/components/dashboard/restock-alerts";
import { ProfitSummary } from "@/components/dashboard/profit-summary";
import { SalesPerformance } from "@/components/dashboard/sales-performance";
import { InventoryHealthCard } from "@/components/dashboard/inventory-health";
import { CustomerInsights } from "@/components/dashboard/customer-insights";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity";
import { isManagerOrAdmin, getUserRole } from "@/lib/permissions";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inventoryValue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [supplierAnalytics, setSupplierAnalytics] = useState<any[]>([]);
  const [restockPredictions, setRestockPredictions] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setMounted(true);
      setUserRole(getUserRole() || "");
      loadDashboardData();
    };
    checkAuth();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        lowStock,
        sales,
        revenue,
        suppliers,
        restock,
        inventory,
      ] = await Promise.all([
        calculateTotalStats(),
        getLowStockItems(),
        calculateSalesData(),
        calculateRevenueByDate(),
        calculateSupplierAnalytics(),
        calculateRestockPredictions(),
        getInventoryItems(),
      ]);
      setStats(statsData);
      setLowStockItems(lowStock);
      setInventoryItems(inventory);

      // Enhance sales data with subcategory information
      const inventoryMap = new Map(
        inventory.map((item: any) => [item.id, item]),
      );
      const salesWithCategory = sales.map((item: any) => ({
        ...item,
        category: inventoryMap.get(item.itemId)?.subcategory || "Uncategorized",
      }));

      setSalesData(salesWithCategory);
      setRevenueData(revenue);
      setSupplierAnalytics(suppliers);
      setRestockPredictions(restock);

      // Calculate category distribution from inventory items (including unsold products)
      const categoriesFromInventory = inventory.reduce(
        (acc: any, item: any) => {
          const subcategoryName = item.subcategory || "Uncategorized";
          const existing = acc.find((c: any) => c.name === subcategoryName);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: subcategoryName, value: 1 });
          }
          return acc;
        },
        [],
      );
      setCategoryData(categoriesFromInventory);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-white hover:bg-gray-50 text-gray-700 shadow-sm border shrink-0">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Business Intelligence
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                  {userRole === "staff"
                    ? "Sales & Inventory Overview"
                    : userRole === "manager"
                      ? "Management Dashboard & Analytics"
                      : "Executive Dashboard & Insights"}
                </p>
              </div>
            </div>
            <Button
              onClick={loadDashboardData}
              disabled={loading}
              variant="outline"
              className="shrink-0">
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SUMMARY METRICS */}
            <div>
              <StatsCards stats={stats} />
            </div>

            {/* INVENTORY SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Inventory Overview</h2>
              </div>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <LowStockAlert items={lowStockItems} />
                <CategoryDistribution
                  data={categoryData}
                  salesData={salesData}
                  inventoryData={inventoryItems}
                />
              </div>
              {isManagerOrAdmin() && (
                <div className="grid gap-6 grid-cols-1">
                  <InventoryHealthCard />
                </div>
              )}
            </div>

            {/* SALES SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">Sales & Performance</h2>
              </div>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <TopProducts salesData={salesData} />
                <RevenueChart data={revenueData} />
              </div>
              <div className="grid gap-6 grid-cols-1">
                <SalesPerformance />
              </div>
            </div>

            {/* FINANCE SECTION - Manager & Admin Only */}
            {isManagerOrAdmin() && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Financial Summary</h2>
                </div>
                <div className="grid gap-6 grid-cols-1">
                  <ProfitSummary />
                </div>
              </div>
            )}

            {/* SUPPLIER SECTION - Manager & Admin Only */}
            {isManagerOrAdmin() && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <h2 className="text-xl font-semibold">Supplier Management</h2>
                </div>
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  <SupplierAnalytics suppliers={supplierAnalytics} />
                  <RestockAlerts items={restockPredictions} />
                </div>
              </div>
            )}

            {/* CUSTOMER SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Customer & Activity</h2>
              </div>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <CustomerInsights />
                <RecentActivityFeed />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
