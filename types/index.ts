export interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  sku: string;
  category: string; // category name for display
  categoryId?: string; // category ID for form
  subcategory?: string; // subcategory name for display
  subcategoryId?: string; // subcategory ID for form
  unit?: string; // e.g., pcs, box, kg
  source?: string; // supplier/source name for display
  sourceId?: string; // source ID for form
  status?: string; // Active, Inactive, Discount
  costPrice?: number; // Original price from supplier (only for admin/manager)
  salePrice: number; // Sale price to customers
  price: number; // Deprecated: for backward compatibility, maps to salePrice
  discount?: number; // discount percentage
  stock: number; // quantity in backend
  minStock: number; // reorderLevel in backend
  location?: string; // storage location
  imageUrl?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryFormData = Omit<
  InventoryItem,
  "id" | "productId" | "createdAt" | "updatedAt" | "userId"
>;

export interface InvoiceItem {
  id: string;
  inventoryItemId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceId?: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  grandTotal?: number; // alias for total
  status: "draft" | "paid" | "cancelled" | "pending";
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesData {
  itemId: string;
  itemName: string;
  totalQuantity: number;
  totalRevenue: number;
  invoiceCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  lastTransactionDate?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: "pending" | "received" | "cancelled";
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface ProductAssociation {
  associationId: number;
  product1: number;
  product1Id: number;
  product1Name: string;
  product1Image: string | null;
  product2: number;
  product2Id: number;
  product2Name: string;
  product2Image: string | null;
  frequency: number;
  associationPercentage: number;
  totalProduct1Purchases: number;
  createdAt: string;
  updatedAt: string;
}

export interface RelatedProduct {
  productId: number;
  productName: string;
  description: string;
  image: string | null;
  skuCode: string;
  salePrice: string;
  associationPercentage: number;
  frequency: number;
}
