import { InventoryItem, Supplier, PurchaseOrder, Invoice } from "@/types"

// API Response Types
interface ApiInventoryItem {
  inventoryId: number
  product: number
  quantity: number
  reorderLevel: number
  location: string
  updatedAt: string
}

interface ApiProduct {
  productId: number
  productName: string
  description: string
  image: string | null
  skuCode: string
  unit: string
  costPrice?: string  // Original price from supplier (hidden from staff)
  salePrice: string   // Sale price to customers
  discount: string
  subcategory: number
  source: number | null
  status: string
  createdAt: string
}

interface ApiSubCategory {
  subcategoryId: number
  category: number
  name: string
  createdAt: string
}

interface ApiCategory {
  categoryId: number
  name: string
  createdAt: string
}

interface ApiSource {
  sourceId: number
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://vuthserver.tailf87741.ts.net"

// Helper to build correct API URLs
function buildApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // If API_BASE_URL already ends with /api, use it directly
  // Otherwise, append /api
  let finalUrl: string
  if (API_BASE_URL.includes('/api')) {
    finalUrl = `${API_BASE_URL}${normalizedEndpoint}`
  } else {
    finalUrl = `${API_BASE_URL}/api${normalizedEndpoint}`
  }
  
  console.log(`[API] Building URL: ${endpoint} -> ${finalUrl}`)
  return finalUrl
}

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    console.error('[API] Request failed:', {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      // Attempt to get more detail here
      errorBody: await res.clone().text().catch(() => "N/A")
    })
    
    // Handle Authentication failure specifically
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        // Optional: Redirect to login if we could access router here
        // window.location.href = "/auth/login"
      }
    }
    
    let errorMessage = res.statusText
    try {
      const errorBody = await res.text()
      console.error('[API] Error response body:', errorBody)
      
      const error = JSON.parse(errorBody)
      console.error('[API] Error response parsed:', error)
      
      // Handle different error response formats
      if (error.detail) {
        errorMessage = error.detail
      } else if (error.lineItems) {
        // Django validation error for line items
        errorMessage = Array.isArray(error.lineItems) 
          ? error.lineItems.join(', ') 
          : error.lineItems
      } else if (typeof error === 'object') {
        // Get first error message from object
        const firstKey = Object.keys(error)[0]
        const firstError = error[firstKey]
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
      }
    } catch (e) {
      // If errorBody is not valid JSON, use generic message
      console.error('[API] Failed to parse error response as JSON, using statusText:', e)
    }
    
    throw new Error(errorMessage)
  }
  
  // Handle empty responses (like DELETE which returns 204 No Content)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null
  }
  
  // Try to parse JSON, return null if empty
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// Client-side functions
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const [inventoryRes, productsRes, subcategoriesRes, categoriesRes, sourcesRes] = await Promise.all([
      fetchAPI("/inventory/") as Promise<ApiInventoryItem[]>,
      fetchAPI("/products/") as Promise<ApiProduct[]>,
      fetchAPI("/subcategories/") as Promise<ApiSubCategory[]>,
      fetchAPI("/categories/") as Promise<ApiCategory[]>,
      fetchAPI("/sources/") as Promise<ApiSource[]>,
    ])

    const products = new Map<number, ApiProduct>(productsRes.map((p) => [p.productId, p]))
    const subcategories = new Map<number, ApiSubCategory>(subcategoriesRes.map((s) => [s.subcategoryId, s]))
    const categories = new Map<number, ApiCategory>(categoriesRes.map((c) => [c.categoryId, c]))
    const sources = new Map<number, ApiSource>(sourcesRes.map((s) => [s.sourceId, s]))

    const items = inventoryRes.map((item) => {
      const product = products.get(item.product)
      const subcategory = product ? subcategories.get(product.subcategory) : null
      const category = subcategory ? categories.get(subcategory.category) : null
      const source = product?.source ? sources.get(product.source) : null

      return {
        id: item.inventoryId.toString(),
        productId: product?.productId.toString() || "",
        name: product?.productName || "Unknown",
        description: product?.description || "",
        sku: product?.skuCode || "",
        category: category?.name || "Uncategorized",
        categoryId: category?.categoryId?.toString() || "",
        subcategory: subcategory?.name || "",
        subcategoryId: product?.subcategory?.toString() || "",
        unit: product?.unit || "pcs",
        source: source?.name || "",
        sourceId: product?.source !== null && product?.source !== undefined ? product.source.toString() : "",
        status: product?.status || "Active",
        costPrice: product?.costPrice ? parseFloat(product.costPrice) : undefined,
        salePrice: product?.salePrice ? parseFloat(product.salePrice) : 0,
        price: product?.salePrice ? parseFloat(product.salePrice) : 0, // backward compatibility
        discount: product?.discount ? parseFloat(product.discount) : 0,
        stock: item.quantity,
        minStock: item.reorderLevel,
        location: item.location,
        imageUrl: product?.image || "",
        userId: "", // Not available in this view
        createdAt: product?.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt,
      }
    })
    
    // Sort by createdAt descending (newest first)
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    throw error
  }
}

export async function addInventoryItem(
  item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<InventoryItem | null> {
  try {
    // item.category is now categoryId and item.subcategory is subcategoryId
    const subcategoryId = item.subcategory ? parseInt(item.subcategory) : null

    if (!subcategoryId) {
      throw new Error("Subcategory is required")
    }

    // 2. Create Product
    const product = await fetchAPI("/products/", {
      method: "POST",
      body: JSON.stringify({
        productName: item.name,
        description: item.description,
        skuCode: item.sku,
        unit: item.unit || "pcs",
        costPrice: item.costPrice?.toFixed(2) || "0.00",
        salePrice: item.salePrice?.toFixed(2) || item.price?.toFixed(2) || "0.00",
        discount: item.discount?.toFixed(2) || "0.00",
        subcategory: subcategoryId,
        source: item.source ? parseInt(item.source) : null,
        image: item.imageUrl,
        status: item.status || "Active",
      }),
    }) as ApiProduct

    // 3. Create Inventory
    const inventory = await fetchAPI("/inventory/", {
      method: "POST",
      body: JSON.stringify({
        product: product.productId,
        quantity: item.stock,
        reorderLevel: item.minStock,
        location: item.location || "Default",
      }),
    }) as ApiInventoryItem

    return {
      id: inventory.inventoryId.toString(),
      name: product.productName,
      description: product.description,
      sku: product.skuCode,
      category: item.category,
      subcategory: item.subcategory,
      unit: product.unit,
      source: item.source,
      status: product.status,
      costPrice: product.costPrice ? parseFloat(product.costPrice) : undefined,
      salePrice: parseFloat(product.salePrice),
      price: parseFloat(product.salePrice),
      discount: parseFloat(product.discount),
      stock: inventory.quantity,
      minStock: inventory.reorderLevel,
      location: inventory.location,
      imageUrl: product.image || undefined,
      userId: "",
      createdAt: product.createdAt,
      updatedAt: inventory.updatedAt,
    }
  } catch (error) {
    console.error("Error adding inventory item:", error)
    return null
  }
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">>,
): Promise<InventoryItem | null> {
  try {
    // Fetch current inventory to get product ID
    const inventory = await fetchAPI(`/inventory/${id}/`) as ApiInventoryItem
    const productId = inventory.product

    // Update Product if needed
    if (updates.name || updates.description || updates.sku || updates.imageUrl || 
        updates.costPrice !== undefined || updates.salePrice !== undefined || updates.price !== undefined ||
        updates.discount !== undefined || 
        updates.unit || updates.status || updates.subcategory || updates.source !== undefined) {
      const productUpdates: Partial<{
        productName: string
        description: string
        skuCode: string
        image: string
        costPrice: string
        salePrice: string
        discount: string
        unit: string
        status: string
        subcategory: number
        source: number | null
      }> = {}
      
      if (updates.name) productUpdates.productName = updates.name
      if (updates.description) productUpdates.description = updates.description
      if (updates.sku) productUpdates.skuCode = updates.sku
      if (updates.imageUrl) productUpdates.image = updates.imageUrl
      if (updates.costPrice !== undefined) productUpdates.costPrice = updates.costPrice.toFixed(2)
      if (updates.salePrice !== undefined) productUpdates.salePrice = updates.salePrice.toFixed(2)
      else if (updates.price !== undefined) productUpdates.salePrice = updates.price.toFixed(2)
      if (updates.discount !== undefined) productUpdates.discount = updates.discount.toFixed(2)
      if (updates.unit) productUpdates.unit = updates.unit
      if (updates.status) productUpdates.status = updates.status
      if (updates.subcategory) productUpdates.subcategory = parseInt(updates.subcategory)
      if (updates.source !== undefined) {
        productUpdates.source = updates.source ? parseInt(updates.source) : null
      }

      if (Object.keys(productUpdates).length > 0) {
        await fetchAPI(`/products/${productId}/`, {
          method: "PATCH",
          body: JSON.stringify(productUpdates),
        })
      }
    }

    // Update Inventory if needed
    const inventoryUpdates: Partial<{
      quantity: number
      reorderLevel: number
      location: string
    }> = {}
    
    if (updates.stock !== undefined) inventoryUpdates.quantity = updates.stock
    if (updates.minStock !== undefined) inventoryUpdates.reorderLevel = updates.minStock
    if (updates.location) inventoryUpdates.location = updates.location

    let updatedInventory = inventory
    if (Object.keys(inventoryUpdates).length > 0) {
      updatedInventory = await fetchAPI(`/inventory/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(inventoryUpdates),
      }) as ApiInventoryItem
    }

    // Fetch updated product details
    const updatedProduct = await fetchAPI(`/products/${productId}/`) as ApiProduct
    const subcategories = await fetchAPI("/subcategories/") as ApiSubCategory[]
    const subcategory = subcategories.find((s) => s.subcategoryId === updatedProduct.subcategory)

    return {
      id: updatedInventory.inventoryId.toString(),
      name: updatedProduct.productName,
      description: updatedProduct.description,
      sku: updatedProduct.skuCode,
      category: subcategory?.name || "Uncategorized",
      subcategory: subcategory?.name || "",
      unit: updatedProduct.unit,
      source: "",
      status: updatedProduct.status,
      costPrice: updatedProduct.costPrice ? parseFloat(updatedProduct.costPrice) : undefined,
      salePrice: parseFloat(updatedProduct.salePrice),
      price: parseFloat(updatedProduct.salePrice),
      discount: parseFloat(updatedProduct.discount),
      stock: updatedInventory.quantity,
      minStock: updatedInventory.reorderLevel,
      location: updatedInventory.location,
      imageUrl: updatedProduct.image || undefined,
      userId: "",
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedInventory.updatedAt,
    }
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return null
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  try {
    // We should probably delete the product, which cascades to inventory?
    // Or delete inventory?
    // Let's check the inventory item to get the product ID
    const inventory = await fetchAPI(`/inventory/${id}/`)
    const productId = inventory.product

    // Delete the product (which should cascade delete the inventory)
    await fetchAPI(`/products/${productId}/`, {
      method: "DELETE",
    })
    return true
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return false
  }
}

export async function uploadProductImage(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append("file", file)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const uploadUrl = buildApiUrl('/upload/')

  try {
    console.log("Uploading image to:", uploadUrl)
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: formData,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Image upload failed:", res.status, errorText)
      throw new Error(`Image upload failed: ${res.statusText}`)
    }

    const data = await res.json()
    console.log("Image uploaded successfully:", data.url)
    return data.url
  } catch (error) {
    console.error("Error uploading image:", error)
    return null
  }
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  // Django backend currently doesn't support direct image deletion via API
  // The image will be replaced when the product is updated
  console.warn("Image deletion not supported by backend API yet.")
  return true
}

// Invoice Operations
export async function getInvoices(): Promise<any[]> {
  try {
    // Invoices from the backend already contain their related purchases
    const invoicesRes = await fetchAPI("/invoices/") as any[]

    const mappedInvoices = invoicesRes.map((invoice: any) => {
      // The backend serializes related purchases under the 'purchases' key
      const items = invoice.purchases || []
      
      return {
        id: invoice.invoiceId.toString(),
        invoiceId: invoice.invoiceId,
        invoiceNumber: `INV-${invoice.invoiceId}`,
        customerName: invoice.customerName || "Guest",
        customerEmail: invoice.customerEmail || "",
        customerPhone: invoice.customerPhone || "",
        status: invoice.status.toLowerCase(),
        paymentMethod: invoice.paymentMethod || "Cash",
        subtotal: parseFloat(invoice.totalBeforeDiscount),
        tax: parseFloat(invoice.tax),
        total: parseFloat(invoice.grandTotal),
        discount: parseFloat(invoice.discount || 0),
        notes: invoice.note,
        items: items.map((item: any) => ({
            id: item.purchaseId.toString(),
            inventoryItemId: item.product.toString(),
            name: item.productName || "Unknown", // productName is from PurchaseReadSerializer
            sku: "", // Not essential for this view
            quantity: item.quantity,
            price: parseFloat(item.pricePerUnit),
            discount: parseFloat(item.discount),
            total: parseFloat(item.subtotal),
        })),
        createdAt: invoice.createdAt,
        updatedAt: invoice.createdAt, // Invoice doesn't have updatedAt in this model
        createdByUsername: invoice.createdByUsername,
        paidAt: invoice.paidAt,
        khqrMd5: invoice.khqrMd5,
      }
    })
    
    return mappedInvoices
  } catch (error) {
    console.error("Error fetching invoices:", error)
    throw error
  }
}

export async function addInvoice(invoice: any): Promise<any | null> {
  try {
    // 1. Find or Create Customer
    const customers = await fetchAPI("/customers/") as any[]
    let customer = customers.find((c) => c.email === invoice.customerEmail)

    if (!customer) {
      console.log("[Invoice] Creating new customer:", {
        name: invoice.customerName,
        email: invoice.customerEmail,
        businessAddress: invoice.customerAddress || "N/A",
        phone: invoice.customerPhone || "000-000-0000",
        customerType: "Individual",
      })
      
      customer = await fetchAPI("/customers/", {
        method: "POST",
        body: JSON.stringify({
          name: invoice.customerName,
          email: invoice.customerEmail,
          businessAddress: invoice.customerAddress || "N/A",
          phone: invoice.customerPhone || "000-000-0000",
          customerType: "Individual",
        }),
      })
      
      console.log("[Invoice] Customer created:", customer)
    } else {
      console.log("[Invoice] Using existing customer:", customer)
    }

    // 2. Prepare line items
    // Map inventoryItemId to product ID by fetching inventory
    console.log("[Invoice] Preparing line items:", invoice.items)
    const lineItems = await Promise.all(invoice.items.map(async (item: any) => {
        try {
          const inventory = await fetchAPI(`/inventory/${item.inventoryItemId}/`)
          console.log(`[Invoice] Inventory ${item.inventoryItemId} -> Product ${inventory.product}`)
          return {
              product: inventory.product,
              quantity: item.quantity,
              pricePerUnit: item.price,
              discount: item.discount || 0
          }
        } catch (error) {
          console.error(`[Invoice] Failed to fetch inventory ${item.inventoryItemId}:`, error)
          throw new Error(`Could not find inventory item: ${item.name}`)
        }
    }))

    console.log("[Invoice] Line items prepared:", lineItems)

    // 3. Create Invoice
    const invoicePayload = {
      customer: customer.customerId,
      paymentMethod: invoice.paymentMethod || "Cash",
      status: invoice.status === "paid" ? "Paid" : (invoice.status === "pending" ? "Pending" : "Draft"),
      note: invoice.notes || "",
      lineItems: lineItems,
      taxPercentage: invoice.tax > 0 ? ((invoice.tax / invoice.subtotal) * 100).toFixed(2) : "0.00",
    }
    
    console.log("[Invoice] Sending payload to backend:", JSON.stringify(invoicePayload, null, 2))
    
    const newInvoice = await fetchAPI("/invoices/", {
      method: "POST",
      body: JSON.stringify(invoicePayload),
    })

    console.log("[Invoice] Created successfully:", newInvoice)

    return {
        ...invoice,
        id: newInvoice.invoiceId.toString(),
        invoiceNumber: `INV-${newInvoice.invoiceId}`,
        createdAt: newInvoice.createdAt,
    }

  } catch (error: any) {
    console.error("[Invoice] Error creating invoice:", error)
    // Try to extract more specific error message
    if (error.message) {
      throw error
    }
    throw new Error("Failed to create invoice. Please try again.")
  }
}

export async function updateInvoice(id: string, updates: any): Promise<any | null> {
  try {
    const updateData: any = {}
    if (updates.status) updateData.status = updates.status === "paid" ? "Paid" : "Draft" // Map status
    if (updates.notes) updateData.note = updates.notes
    
    // Note: Updating items or customer details is complex with the current API structure
    // and might require separate calls or isn't fully supported by a simple PATCH on invoice
    
    const updatedInvoice = await fetchAPI(`/invoices/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(updateData)
    })

    return {
        id: updatedInvoice.invoiceId.toString(),
        status: updatedInvoice.status.toLowerCase(),
        // ... return other fields
    }
  } catch (error) {
    console.error("Error updating invoice:", error)
    return null
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  try {
    await fetchAPI(`/invoices/${id}/`, { method: "DELETE" })
    return true
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return false
  }
}

// Supplier CRUD operations
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const sources = await fetchAPI("/sources/")
    const suppliers: Supplier[] = sources.map((s: any) => ({
      id: s.sourceId.toString(),
      name: s.name,
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      address: s.address,
      notes: "",
      lastTransactionDate: s.createdAt, // Placeholder
      createdAt: s.createdAt,
      updatedAt: s.createdAt,
      userId: "",
    }))
    
    // Sort by createdAt descending (newest first)
    return suppliers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    throw error
  }
}

export async function addSupplier(
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<Supplier | null> {
  try {
    const newSource = await fetchAPI("/sources/", {
      method: "POST",
      body: JSON.stringify({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
      }),
    })
    return {
      id: newSource.sourceId.toString(),
      name: newSource.name,
      contactPerson: newSource.contactPerson,
      email: newSource.email,
      phone: newSource.phone,
      address: newSource.address,
      notes: "",
      createdAt: newSource.createdAt,
      updatedAt: newSource.createdAt,
    }
  } catch (error) {
    console.error("Error adding supplier:", error)
    return null
  }
}

export async function updateSupplier(
  id: string,
  updates: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt" | "userId">>,
): Promise<Supplier | null> {
  try {
    const updateData: any = {}
    if (updates.name) updateData.name = updates.name
    if (updates.contactPerson) updateData.contactPerson = updates.contactPerson
    if (updates.email) updateData.email = updates.email
    if (updates.phone) updateData.phone = updates.phone
    if (updates.address) updateData.address = updates.address

    const updatedSource = await fetchAPI(`/sources/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    })

    return {
      id: updatedSource.sourceId.toString(),
      name: updatedSource.name,
      contactPerson: updatedSource.contactPerson,
      email: updatedSource.email,
      phone: updatedSource.phone,
      address: updatedSource.address,
      notes: "",
      createdAt: updatedSource.createdAt,
      updatedAt: updatedSource.createdAt,
    }
  } catch (error) {
    console.error("Error updating supplier:", error)
    return null
  }
}

export async function deleteSupplier(id: string): Promise<boolean> {
  try {
    await fetchAPI(`/sources/${id}/`, { method: "DELETE" })
    return true
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return false
  }
}

// Purchase Order CRUD operations
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    // Mapping NewStock to PurchaseOrder
    // NewStock is a single item addition.
    const newStocks = await fetchAPI("/newstock/")
    const productsRes = await fetchAPI("/products/")
    const products = new Map<any, any>(productsRes.map((p: any) => [p.productId, p]))
    const suppliersRes = await fetchAPI("/sources/")
    const suppliers = new Map<any, any>(suppliersRes.map((s: any) => [s.sourceId, s]))

    const orders: PurchaseOrder[] = newStocks.map((stock: any) => {
        // We need to fetch inventory to get product ID?
        // NewStock has 'inventory' field which is inventoryId.
        // We don't have inventory map here.
        // This is getting complicated.
        // Let's assume we can get product info some other way or fetch inventory.
        // For now, returning simplified data.
        const supplier = suppliers.get(stock.supplier)
        
        return {
            id: stock.newstockId.toString(),
            poNumber: `PO-${stock.newstockId}`,
            supplierId: stock.supplier?.toString() || "",
            supplierName: supplier?.name || "Unknown",
            orderDate: stock.receivedDate,
            expectedDeliveryDate: stock.receivedDate,
            status: "received", // NewStock implies it's added
            items: [], // Populating items would require fetching inventory -> product
            totalAmount: parseFloat(stock.purchasePrice) * stock.quantity,
            notes: stock.note,
            receivedDate: stock.receivedDate,
            createdAt: stock.createdAt,
            updatedAt: stock.createdAt,
        }
    })
    
    // Sort by createdAt descending (newest first)
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    throw error
  }
}

export async function addPurchaseOrder(
  po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt" | "userId">,
): Promise<PurchaseOrder | null> {
  try {
    // We need to create NewStock entries for each item
    // But NewStock requires inventoryId.
    // po.items has productId (which we mapped to inventoryId in getInventoryItems? No, in getInventoryItems id=inventoryId)
    // So po.items[].productId is inventoryId.
    
    for (const item of po.items) {
        await fetchAPI("/newstock/", {
            method: "POST",
            body: JSON.stringify({
                inventory: item.productId, // Assuming this is inventoryId
                quantity: item.quantity,
                purchasePrice: item.unitPrice,
                receivedDate: po.receivedDate || new Date().toISOString().split('T')[0],
                supplier: po.supplierId,
                note: po.notes
            })
        })
    }

    return {
        ...po,
        id: "temp-id", // We created multiple records, no single ID
        poNumber: "PO-NEW",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as PurchaseOrder
  } catch (error) {
    console.error("Error adding purchase order:", error)
    return null
  }
}

export async function updatePurchaseOrder(
  id: string,
  updates: Partial<Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt" | "userId">>,
): Promise<PurchaseOrder | null> {
    console.warn("Update PO not fully supported via NewStock API")
    return null
}

export async function deletePurchaseOrder(id: string): Promise<boolean> {
    try {
        await fetchAPI(`/newstock/${id}/`, { method: "DELETE" })
        return true
    } catch (error) {
        console.error("Error deleting purchase order:", error)
        return false
    }
}

export async function login(username: string, password: string): Promise<any> {
  try {
    const res = await fetch(buildApiUrl('/login/'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail || "Login failed")
    }

    const data = await res.json()
    if (data.token) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify({
        id: data.user_id,
        username: data.username,
        role: data.role
      }))
    }
    return data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }
}

export async function register(username: string, password: string, email: string) {
  const res = await fetch(buildApiUrl('/register/'), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, email }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }))
    // Handle different error formats
    let errorMessage = "Registration failed"
    if (errorData.detail) {
      errorMessage = errorData.detail
    } else if (errorData.username) {
      errorMessage = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username
    } else if (errorData.email) {
      errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
    } else if (errorData.password) {
      errorMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
    }
    throw new Error(errorMessage)
  }

  return res.json()
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  const token = localStorage.getItem("token")
  if (!userStr || !token) return null
  return JSON.parse(userStr)
}

// Activity Log API
export async function getActivityLogs(): Promise<any[]> {
  try {
    const logs = await fetchAPI("/activitylogs/") as any[]
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    throw error
  }
}

// KHQR Payment API
export async function checkInvoicePayment(invoiceId: number): Promise<any> {
  try {
    console.log(`[API] Checking payment status for invoice ${invoiceId}`)
    const result = await fetchAPI(`/invoices/${invoiceId}/check_payment/`, {
      method: "POST",
    })
    return result
  } catch (error) {
    console.error(`Error checking payment for invoice ${invoiceId}:`, error)
    throw error
  }
}

export async function getProductAssociations(productId: string): Promise<any[]> {
  try {
    const response = await fetchAPI(`/products/${productId}/associations/`);
    return response;
  } catch (error) {
    throw error;
  }
}

// NewStock API
export interface NewStockRecord {
  newstockId: number
  inventory: number
  quantity: number
  purchasePrice: string
  receivedDate: string
  supplier: number | null
  addedByUser: number | null
  note: string | null
  createdAt: string
  productName?: string
  productSku?: string
  supplierName?: string
  userName?: string
}

export async function getNewStockRecords(): Promise<NewStockRecord[]> {
  try {
    const response = await fetchAPI("/newstock/")
    return response
  } catch (error) {
    console.error("Error fetching new stock records:", error)
    throw error
  }
}

export async function createNewStockRecord(data: {
  inventory: number
  quantity: number
  purchasePrice: number
  receivedDate: string
  supplier?: number | null
  note?: string
}): Promise<NewStockRecord> {
  try {
    const response = await fetchAPI("/newstock/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  } catch (error) {
    console.error("Error creating new stock record:", error)
    throw error
  }
}
