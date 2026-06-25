'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AdminImagePreview } from '@/components/admin/admin-image';

type AdminImageUploadProps = {
  label?: string;
  hint?: string;
  existingUrl?: string | null;
  file: File | null;
  removeExisting: boolean;
  onChange: (file: File | null, removeExisting: boolean) => void;
  accept?: string;
};

export function AdminImageUpload({
  label = 'Image',
  hint = 'PNG, JPG, or WebP up to 5MB',
  existingUrl,
  file,
  removeExisting,
  onChange,
  accept = 'image/png,image/jpeg,image/jpg,image/webp,image/gif',
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = previewUrl ?? (removeExisting ? null : existingUrl ?? null);

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    if (file || previewUrl) {
      onChange(null, false);
      return;
    }
    if (existingUrl) {
      onChange(null, true);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {displayUrl ? (
        <div className="relative">
          <AdminImagePreview src={displayUrl} alt="" className="max-h-40" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-[--color-border] rounded-lg p-6 text-center hover:border-[--color-gold] transition-colors"
      >
        <Upload className="h-6 w-6 text-[--color-text-secondary] mx-auto mb-1" />
        <p className="text-sm text-[--color-text-secondary]">
          {displayUrl ? 'Click to replace image' : 'Click to upload'}
        </p>
        {hint ? <p className="text-xs text-[--color-text-secondary] mt-1">{hint}</p> : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null, false)}
      />
    </div>
  );
}

export function useAdminImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  const onImageChange = (nextFile: File | null, remove: boolean) => {
    setFile(nextFile);
    setRemoveExisting(remove);
  };

  const resetImage = () => {
    setFile(null);
    setRemoveExisting(false);
  };

  return { file, removeExisting, onImageChange, resetImage };
}
