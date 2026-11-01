"use client";

import Image from "next/image";
import * as React from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { apiJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploaderProps {
  folder: "mahum/products" | "mahum/categories" | "mahum/avatars";
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  className?: string;
}

export function ImageUploader({ folder, value, onChange, multiple = false, className }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        const result = await apiJson<UploadedImage>("/api/upload", { method: "POST", body: formData });
        uploaded.push(result);
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(publicId: string) {
    onChange(value.filter((img) => img.publicId !== publicId));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-3">
        {value.map((image) => (
          <div key={image.publicId} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border-muted">
            <Image src={image.url} alt="Uploaded" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(image.publicId)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <label
          className={cn(
            "flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-muted text-neutral-400 hover:border-brand-400 hover:text-brand-600",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-[10px]">Upload</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      <p className="text-xs text-neutral-400">JPEG, PNG or WEBP. Max 5MB each.</p>
    </div>
  );
}
