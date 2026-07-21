// src/components/ui/ImageUploadField.tsx
import React, { useRef, useState } from "react";
import { clsx } from "clsx";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUploadImageMutation, type UploadCategory } from "../../store/api/uploadApi";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ImageUploadFieldProps {
  label: string;
  category: UploadCategory;
  value?: string;
  onChange: (url: string | undefined) => void;
  shape?: "square" | "circle" | "wide";
  helperText?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  category,
  value,
  onChange,
  shape = "square",
  helperText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadImage, { isLoading }] = useUploadImageMutation();
  const [localPreview, setLocalPreview] = useState<string | undefined>(undefined);

  const displayUrl = localPreview ?? value;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WEBP or GIF images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large — the limit is 5MB");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    try {
      const result = await uploadImage({ file, category }).unwrap();
      onChange(result.url);
    } catch (err: any) {
      toast.error(err?.data?.message || "Upload failed — try again");
      setLocalPreview(undefined);
    }
  };

  const shapeClass =
    shape === "circle" ? "rounded-full aspect-square" : shape === "wide" ? "rounded-lg aspect-[3/1]" : "rounded-lg aspect-square";

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
      <div
        className={clsx(
          "relative w-full max-w-[220px] border border-dashed border-white/15 bg-white/[0.03] overflow-hidden cursor-pointer group hover:border-volt-400/50 transition-colors",
          shape === "wide" && "max-w-full",
          shapeClass,
        )}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-1.5 text-slate-500 group-hover:text-slate-400">
            <ImagePlus size={20} />
            <span className="text-2xs">Click to upload</span>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-pitch-900/70 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-volt-400" />
          </div>
        )}
        {displayUrl && !isLoading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLocalPreview(undefined);
              onChange(undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-1.5 right-1.5 bg-pitch-900/80 hover:bg-ember-600 text-white rounded-full p-1 transition-colors"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <X size={12} />
          </button>
        )}
      </div>
      {helperText && <p className="text-2xs text-slate-500 mt-1.5">{helperText}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};