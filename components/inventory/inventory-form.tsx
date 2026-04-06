"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { InventoryItem, InventoryFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadProductImage, deleteProductImage } from "@/lib/api";
import { Upload, X, Plus, ArrowLeft } from "lucide-react";
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
  onSubmit: (data: InventoryFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export function InventoryForm({
  item,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
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
    price: "",
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

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

  useEffect(() => {
    if (formData.category) {
      const filtered = subcategories.filter(
        (sub) => sub.category.toString() === formData.category,
      );
      setFilteredSubcategories(filtered);

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
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type. Please upload: JPG, PNG, GIF, or WebP`);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File is too large. Maximum size is 5MB");
        return;
      }

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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail ||
          errorData.error ||
          Object.values(errorData).join(", ") ||
          "Failed to create supplier";
        console.error("Error creating supplier:", errorData);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert(error instanceof Error ? error.message : "Error creating supplier");
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail ||
          errorData.error ||
          Object.values(errorData).join(", ") ||
          "Failed to create category";
        console.error("Error creating category:", errorData);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert(error instanceof Error ? error.message : "Error creating category");
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail ||
          errorData.error ||
          Object.values(errorData).join(", ") ||
          "Failed to create subcategory";
        console.error("Error creating subcategory:", errorData);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
      alert(
        error instanceof Error ? error.message : "Error creating subcategory",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = {
      name: "Product Name",
      description: "Description",
      sku: "SKU",
      category: "Category",
      subcategory: "Subcategory",
      salePrice: "Sale Price",
      stock: "Stock Quantity",
      minStock: "Reorder Level",
      location: "Storage Location",
    };

    const missingFields: string[] = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      const value = (formData as any)[field];
      if (!value || value === "") {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields:\n\n${missingFields.join("\n")}`,
      );
      return;
    }

    if (formData.status === "Discount" && parseFloat(formData.discount) <= 0) {
      alert(
        "Discount amount is required when status is set to 'Discount'. Please enter a discount percentage greater than 0.",
      );
      return;
    }

    setIsUploading(true);

    let imageUrl = formData.imageUrl;

    try {
      if (imageFile) {
        try {
          const uploadedUrl = await uploadProductImage(imageFile);

          if (uploadedUrl) {
            imageUrl = uploadedUrl;

            if (formData.imageUrl && formData.imageUrl !== uploadedUrl) {
              await deleteProductImage(formData.imageUrl);
            }
          }
        } catch (uploadError) {
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload image";
          alert(errorMessage);
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
        sourceId: formData.sourceId || undefined,
        status: formData.status,
        costPrice: formData.costPrice
          ? Number.parseFloat(formData.costPrice)
          : undefined,
        salePrice: formData.salePrice
          ? Number.parseFloat(formData.salePrice)
          : 0,
        price: formData.salePrice ? Number.parseFloat(formData.salePrice) : 0,
        discount: formData.discount ? Number.parseFloat(formData.discount) : 0,
        stock: formData.stock ? Number.parseInt(formData.stock, 10) : 0,
        minStock: formData.minStock
          ? Number.parseInt(formData.minStock, 10)
          : 0,
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
    <div className="min-h-screen bg-gray-50">
      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload Section */}
          <div className="bg-white rounded-lg border p-6">
            <Label className="text-base font-semibold mb-4 block">
              Product Image
            </Label>
            <div className="flex items-center gap-6">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg border overflow-hidden bg-gray-50">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Product preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all bg-gray-50">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-2">Upload</span>
                </label>
              )}
              <div className="flex-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-500">
                  Recommended: Square image, max 5MB
                </p>
                {!imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("image")?.click()}
                    className="mt-2">
                    Choose Image
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="sku" className="text-sm font-medium">
                  SKU *
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  rows={3}
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>

          {/* Category & Classification */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">
              Category & Classification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category *
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                    disabled={isLoadingCategories}
                    className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option
                        key={category.categoryId}
                        value={category.categoryId}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewCategoryDialog(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="subcategory" className="text-sm font-medium">
                  Subcategory *
                </Label>
                <div className="flex gap-2 mt-1.5">
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
                    className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100">
                    <option value="">
                      {!formData.category
                        ? "Select category first"
                        : filteredSubcategories.length === 0
                          ? "No subcategories"
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
                    disabled={!formData.category}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salePrice" className="text-sm font-medium">
                  Sale Price ($) *
                </Label>
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
                  className="mt-1.5"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="costPrice" className="text-sm font-medium">
                  Cost Price ($)
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                  className="mt-1.5"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only visible to admin and managers
                </p>
              </div>

              <div>
                <Label htmlFor="discount" className="text-sm font-medium">
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
                  className="mt-1.5"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="unit" className="text-sm font-medium">
                  Unit *
                </Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  required
                  className="mt-1.5 w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="liter">Liter</option>
                  <option value="meter">Meter</option>
                  <option value="pack">Pack</option>
                  <option value="unit">Unit</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status *
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  required
                  className="mt-1.5 w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discount">Discount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock & Location */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Stock & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock" className="text-sm font-medium">
                  Stock Quantity *
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="minStock" className="text-sm font-medium">
                  Reorder Level *
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Storage Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="e.g., Warehouse A, Shelf 12"
                />
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Supplier Information</h2>
            <div>
              <Label htmlFor="source" className="text-sm font-medium">
                Source/Supplier
              </Label>
              <div className="flex gap-2 mt-1.5">
                <select
                  id="source"
                  value={formData.sourceId}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceId: e.target.value })
                  }
                  disabled={isLoadingSources}
                  className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                  onClick={() => setShowNewSupplierDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Dialogs remain the same */}
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
    </div>
  );
}
