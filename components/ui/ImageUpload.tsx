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
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setSelectedFileSize(file.size);
    
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

      const data = await uploadWithProgress(formData);
      setPreview(data.url);
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setLoading(false);
      setProgress(0);
      setSelectedFileSize(null);
    }
  }

  function uploadWithProgress(
    formData: FormData
  ): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', '/api/admin/upload');
      xhr.send(formData);
    });
  }

  async function handleRemove() {
    if (!preview) return;

    // Extract filename from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/filename
    const parts = preview.split('/');
    const filename = parts[parts.length - 1];

    try {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          filename,
        }),
      });
    } catch {
      // Silently fail on delete — still clear locally
    }

    setPreview(null);
    onUpload('');
  }

  const onClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      {preview ? (
        <div className="relative">
          <Image
            src={preview}
            alt={label}
            width={aspectRatio === "square" ? 96 : 240}
            height={aspectRatio === "square" ? 96 : 160}
            className="object-cover rounded-lg"
          />
          {!loading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 z-10
                         bg-white/90 hover:bg-red-50
                         text-stone-500 hover:text-red-600
                         rounded-full p-1.5 shadow-sm
                         transition-colors border 
                         border-stone-200"
              title="Remove image"
            >
              <svg width="14" height="14" 
                   viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div
          className={`
            relative flex flex-col items-center 
            justify-center gap-2 rounded-xl border-2 
            border-dashed cursor-pointer
            transition-all duration-200 p-6
            min-h-[140px]
            ${isDragging
              ? 'border-stone-400 bg-stone-50 ring-2 ring-stone-300'
              : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={onClick}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          {/* Upload icon */}
          <svg width="28" height="28" viewBox="0 0 24 24"
               fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round"
               className="text-stone-300">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 
                     0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-stone-600">
              {isDragging 
                ? 'Drop image here' 
                : 'Click or drag image here'}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              JPG, PNG, WebP or GIF · Max 2MB
            </p>
          </div>
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
      )}

      {selectedFileSize && !loading && (
        <p className={`text-xs mt-1 ${
          selectedFileSize > 2 * 1024 * 1024
            ? 'text-red-500'
            : 'text-stone-400'
        }`}>
          {(selectedFileSize / 1024 / 1024).toFixed(2)} MB
          {selectedFileSize > 2 * 1024 * 1024 && 
            ' — exceeds 2MB limit'}
        </p>
      )}

      {loading && (
        <div className="w-full mt-2">
          <div className="flex justify-between text-xs 
                          text-stone-500 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-stone-100 
                          rounded-full h-1.5">
            <div
              className="bg-stone-800 h-1.5 rounded-full 
                         transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
