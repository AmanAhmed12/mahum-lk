"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ImageUploader, type UploadedImage } from "@/components/forms/image-uploader";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { apiJson } from "@/lib/api/client";
import { slugify } from "@/lib/utils";
import { productSchema, type ProductInput } from "@/lib/validators/catalogue";

interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFormInitialValues extends ProductInput {
  id?: string;
}

export function ProductForm({
  categories,
  initialValues,
}: {
  categories: CategoryOption[];
  initialValues?: ProductFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues?.id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues ?? {
      name: "",
      slug: "",
      description: "",
      sku: "",
      price: 0,
      categoryId: categories[0]?.id ?? "",
      isActive: true,
      images: [],
      quantity: 0,
      reorderLevel: 5,
    },
  });

  const nameValue = watch("name");

  async function onSubmit(values: ProductInput) {
    try {
      if (isEditing && initialValues?.id) {
        await apiJson(`/api/products/${initialValues.id}`, { method: "PATCH", body: JSON.stringify(values) });
        toast.success("Product updated.");
      } else {
        await apiJson("/api/products", { method: "POST", body: JSON.stringify(values) });
        toast.success("Product created.");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          {...register("name")}
          onBlur={() => {
            if (!isEditing) setValue("slug", slugify(nameValue || ""));
          }}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...register("slug")} />
        <FieldError message={errors.slug?.message} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} />
          <FieldError message={errors.sku?.message} />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" {...register("categoryId")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.categoryId?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (LKR)</Label>
          <Input id="price" type="number" step="0.01" {...register("price")} />
          <FieldError message={errors.price?.message} />
        </div>
        <div>
          <Label htmlFor="discountPrice">Discount Price (optional)</Label>
          <Input
            id="discountPrice"
            type="number"
            step="0.01"
            {...register("discountPrice", {
              setValueAs: (value) => (value === "" || value === null ? undefined : Number(value)),
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Stock Quantity</Label>
          <Input id="quantity" type="number" {...register("quantity")} />
        </div>
        <div>
          <Label htmlFor="reorderLevel">Reorder Level</Label>
          <Input id="reorderLevel" type="number" {...register("reorderLevel")} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" className="h-4 w-4" {...register("isActive")} />
        <Label htmlFor="isActive" className="mb-0">
          Active (visible in the shop)
        </Label>
      </div>

      <div>
        <Label>Product Images</Label>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader
              folder="mahum/products"
              multiple
              value={field.value as UploadedImage[]}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        {isEditing ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}
