"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { UPLOAD_BUCKETS, MAX_UPLOAD_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/domain/upload.types";
import { Spinner } from "@/components/ui/Spinner";

interface ImageUploadProps {
  currentUrl?: string | null;
  bucket: (typeof UPLOAD_BUCKETS)[number];
  entityId: string;
  onUpload: (url: string) => void;
  label?: string;
  aspectRatio?: "square" | "landscape";
  disabled?: boolean;
}

export function ImageUpload({
  currentUrl,
  bucket,
  entityId,
  onUpload,
  label = "Image",
  aspectRatio = "square",
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError("Image must be under 2MB.");
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      setError("Please upload a JPEG, PNG, WebP, or GIF.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("entityId", entityId);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      setPreview(data.url);
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  const onClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div
        className={`relative cursor-pointer rounded-lg border border-dashed border-gray-300 bg-white p-2 text-center hover:bg-gray-50 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={onClick}
      >
        {preview ? (
          <Image
            src={preview}
            alt={label}
            width={aspectRatio === "square" ? 96 : 240}
            height={aspectRatio === "square" ? 96 : 160}
            className="object-cover rounded-lg"
          />
        ) : (
          <div className="flex h-24 w-full items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-400"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8
           a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={disabled || loading}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <Spinner size={5} />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
