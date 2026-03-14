"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { InventoryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadProductImage, deleteProductImage } from "@/lib/api";
import { Upload, X, Plus } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Source {
  sourceId: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Category {
  categoryId: number;
  name: string;
}

interface SubCategory {
  subcategoryId: number;
  category: number;
  name: string;
}

interface InventoryFormProps {
  item?: InventoryItem | null;
  onSubmit: (
    data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">,
  ) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function InventoryForm({
  item,
  onSubmit,
  onCancel,
  onDelete,
}: InventoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    subcategory: "",
    unit: "pcs",
    sourceId: "",
    status: "Active",
    costPrice: "",
    salePrice: "",
    price: "", // deprecated, for backward compatibility
    discount: "0",
    stock: "",
    minStock: "",
    location: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    SubCategory[]
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showNewSubcategoryDialog, setShowNewSubcategoryDialog] =
    useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
  });
  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
  });

  // Fetch sources, categories, and subcategories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch sources
        const sourcesResponse = await fetch(
          "http://localhost:8000/api/sources/",
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (sourcesResponse.ok) {
          const sourcesData = await sourcesResponse.json();
          setSources(sourcesData);
        }

        // Fetch categories
        const categoriesResponse = await fetch(
          "http://localhost:8000/api/categories/",
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        // Fetch subcategories
        const subcategoriesResponse = await fetch(
          "http://localhost:8000/api/subcategories/",
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (subcategoriesResponse.ok) {
          const subcategoriesData = await subcategoriesResponse.json();
          setSubcategories(subcategoriesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingSources(false);
        setIsLoadingCategories(false);
      }
    };
    fetchData();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const filtered = subcategories.filter(
        (sub) => sub.category.toString() === formData.category,
      );
      setFilteredSubcategories(filtered);

      // Only reset subcategory if it's not in the filtered list AND we're not loading an item
      if (
        formData.subcategory &&
        !filtered.some(
          (sub) => sub.subcategoryId.toString() === formData.subcategory,
        ) &&
        !item
      ) {
        setFormData((prev) => ({ ...prev, subcategory: "" }));
      }
    } else {
      setFilteredSubcategories([]);
      if (!item) {
        setFormData((prev) => ({ ...prev, subcategory: "" }));
      }
    }
  }, [formData.category, subcategories, item]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        sku: item.sku,
        category: item.categoryId || "",
        subcategory: item.subcategoryId || "",
        unit: item.unit || "pcs",
        sourceId: item.sourceId || "",
        status: item.status || "Active",
        costPrice: item.costPrice?.toString() || "",
        salePrice: item.salePrice?.toString() || item.price?.toString() || "",
        price: item.salePrice?.toString() || item.price?.toString() || "",
        discount: item.discount?.toString() || "0",
        stock: item.stock.toString(),
        minStock: item.minStock.toString(),
        location: item.location || "",
        imageUrl: item.imageUrl || "",
      });
      setImagePreview(item.imageUrl || "");
    }
  }, [item]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    if (formData.imageUrl && !imageFile) {
      // Delete from storage if it's an existing image
      await deleteProductImage(formData.imageUrl);
    }
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleCreateSupplier = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/sources/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSupplier),
      });

      if (response.ok) {
        const createdSource = await response.json();
        setSources([...sources, createdSource]);
        setFormData({
          ...formData,
          sourceId: createdSource.sourceId.toString(),
        });
        setShowNewSupplierDialog(false);
        setNewSupplier({
          name: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
        });
        alert("Supplier created successfully!");
      } else {
        alert("Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("Error creating supplier");
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/categories/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        const createdCategory = await response.json();
        setCategories([...categories, createdCategory]);
        setFormData({
          ...formData,
          category: createdCategory.categoryId.toString(),
        });
        setShowNewCategoryDialog(false);
        setNewCategory({ name: "" });
        alert("Category created successfully!");
      } else {
        alert("Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Error creating category");
    }
  };

  const handleCreateSubcategory = async () => {
    if (!formData.category) {
      alert("Please select a category first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/subcategories/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newSubcategory,
          category: formData.category,
        }),
      });

      if (response.ok) {
        const createdSubcategory = await response.json();
        setSubcategories([...subcategories, createdSubcategory]);
        setFormData({
          ...formData,
          subcategory: createdSubcategory.subcategoryId.toString(),
        });
        setShowNewSubcategoryDialog(false);
        setNewSubcategory({ name: "" });
        alert("Subcategory created successfully!");
      } else {
        alert("Failed to create subcategory");
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
      alert("Error creating subcategory");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: if status is Discount, discount must be greater than 0
    if (formData.status === "Discount" && parseFloat(formData.discount) <= 0) {
      alert(
        "Discount amount is required when status is set to 'Discount'. Please enter a discount percentage greater than 0.",
      );
      return;
    }

    setIsUploading(true);

    let imageUrl = formData.imageUrl;

    try {
      // Upload new image if selected
      if (imageFile) {
        console.log("Uploading new image...");
        const uploadedUrl = await uploadProductImage(imageFile);

        if (uploadedUrl) {
          console.log("Image uploaded successfully:", uploadedUrl);
          imageUrl = uploadedUrl;

          // Delete old image if exists (only if it was successfully replaced)
          if (formData.imageUrl && formData.imageUrl !== uploadedUrl) {
            await deleteProductImage(formData.imageUrl);
          }
        } else {
          console.error("Failed to upload image");
          alert("Failed to upload image. Please try again.");
          setIsUploading(false);
          return;
        }
      }

      onSubmit({
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        category: formData.category,
        subcategory: formData.subcategory,
        unit: formData.unit,
        sourceId: formData.sourceId,
        status: formData.status,
        costPrice: formData.costPrice
          ? Number.parseFloat(formData.costPrice)
          : undefined,
        salePrice: Number.parseFloat(formData.salePrice || formData.price),
        price: Number.parseFloat(formData.salePrice || formData.price),
        discount: Number.parseFloat(formData.discount),
        stock: Number.parseInt(formData.stock),
        minStock: Number.parseInt(formData.minStock),
        location: formData.location,
        imageUrl: imageUrl || undefined,
      });
    } catch (error) {
      console.error("Error in form submission:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image">Product Image</Label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative w-32 h-32 rounded-lg border overflow-hidden">
              <Image
                src={imagePreview || "/placeholder.svg"}
                alt="Product preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-2">
                Upload Image
              </span>
            </label>
          )}
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <div className="flex gap-2">
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
              disabled={isLoadingCategories}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowNewCategoryDialog(true)}
              title="Add new category">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <div className="flex gap-2">
            <select
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) =>
                setFormData({ ...formData, subcategory: e.target.value })
              }
              required
              disabled={
                !formData.category || filteredSubcategories.length === 0
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">
                {!formData.category
                  ? "Select category first"
                  : filteredSubcategories.length === 0
                    ? "No subcategories available"
                    : "Select subcategory"}
              </option>
              {filteredSubcategories.map((subcategory) => (
                <option
                  key={subcategory.subcategoryId}
                  value={subcategory.subcategoryId}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (!formData.category) {
                  alert("Please select a category first");
                } else {
                  setShowNewSubcategoryDialog(true);
                }
              }}
              title="Add new subcategory"
              disabled={!formData.category}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <select
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="pcs">Pieces (pcs)</option>
            <option value="box">Box</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="liter">Liter</option>
            <option value="meter">Meter</option>
            <option value="pack">Pack</option>
            <option value="unit">Unit</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discount">Discount</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price ($) - Supplier Price</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPrice}
            onChange={(e) =>
              setFormData({ ...formData, costPrice: e.target.value })
            }
            placeholder="Optional: Original price from supplier"
          />
          <p className="text-xs text-muted-foreground">
            Only visible to admin and managers
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salePrice">Sale Price ($) - Customer Price</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.salePrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                salePrice: e.target.value,
                price: e.target.value,
              })
            }
            required
            placeholder="Price customers will pay"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount">
            Discount (%)
            {formData.status === "Discount" && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discount}
            onChange={(e) =>
              setFormData({ ...formData, discount: e.target.value })
            }
            required
          />
          {formData.status === "Discount" && (
            <p className="text-xs text-red-500">
              Discount amount is required for Discount status
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source/Supplier</Label>
        <div className="flex gap-2">
          <select
            id="source"
            value={formData.sourceId}
            onChange={(e) =>
              setFormData({ ...formData, sourceId: e.target.value })
            }
            disabled={isLoadingSources}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Select supplier (optional)</option>
            {sources.map((source) => (
              <option key={source.sourceId} value={source.sourceId}>
                {source.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowNewSupplierDialog(true)}
            title="Add new supplier">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Reorder Level (Low Stock Alert)</Label>
          <Input
            id="minStock"
            type="number"
            min="0"
            value={formData.minStock}
            onChange={(e) =>
              setFormData({ ...formData, minStock: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Storage Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
          placeholder="e.g., Warehouse A, Shelf 12"
        />
      </div>

      <div className="flex justify-between gap-2">
        {item && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isUploading}>
            Delete Item
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isUploading}>
            {isUploading ? "Uploading..." : item ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </div>

      {/* New Supplier Dialog */}
      <Dialog
        open={showNewSupplierDialog}
        onOpenChange={setShowNewSupplierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Fill in the supplier details to add them to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Supplier Name *</Label>
              <Input
                id="supplier-name"
                value={newSupplier.name}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, name: e.target.value })
                }
                required
                placeholder="Enter supplier name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-contact">Contact Person</Label>
              <Input
                id="supplier-contact"
                value={newSupplier.contactPerson}
                onChange={(e) =>
                  setNewSupplier({
                    ...newSupplier,
                    contactPerson: e.target.value,
                  })
                }
                placeholder="Enter contact person"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                value={newSupplier.phone}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={newSupplier.email}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">Address</Label>
              <Textarea
                id="supplier-address"
                value={newSupplier.address}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, address: e.target.value })
                }
                placeholder="Enter address"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewSupplierDialog(false);
                setNewSupplier({
                  name: "",
                  contactPerson: "",
                  phone: "",
                  email: "",
                  address: "",
                });
              }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateSupplier}
              disabled={!newSupplier.name}
              className="bg-blue-600 hover:bg-blue-700">
              Add Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog
        open={showNewCategoryDialog}
        onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for your products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                required
                placeholder="Enter category name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewCategoryDialog(false);
                setNewCategory({ name: "" });
              }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategory.name}
              className="bg-blue-600 hover:bg-blue-700">
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Subcategory Dialog */}
      <Dialog
        open={showNewSubcategoryDialog}
        onOpenChange={setShowNewSubcategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
            <DialogDescription>
              Create a new subcategory under{" "}
              {categories.find(
                (c) => c.categoryId.toString() === formData.category,
              )?.name || "the selected category"}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subcategory-name">Subcategory Name *</Label>
              <Input
                id="subcategory-name"
                value={newSubcategory.name}
                onChange={(e) =>
                  setNewSubcategory({ ...newSubcategory, name: e.target.value })
                }
                required
                placeholder="Enter subcategory name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewSubcategoryDialog(false);
                setNewSubcategory({ name: "" });
              }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateSubcategory}
              disabled={!newSubcategory.name}
              className="bg-blue-600 hover:bg-blue-700">
              Add Subcategory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
