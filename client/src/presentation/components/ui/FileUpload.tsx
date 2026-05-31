import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '@/infrastructure/config/constants';

export interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  maxSize?: number; // en bytes
  onChange?: (file: File | null) => void;
  value?: File | null;
  preview?: string; // URL de preview
  required?: boolean;
  disabled?: boolean;
}

/**
 * Composant Upload de fichier (photo de profil)
 * - Preview de l'image
 * - Validation du type et de la taille
 * - Drag & drop support
 */
export const FileUpload = memo<FileUploadProps>(function FileUpload({
  label = 'Photo de profil',
  error,
  helperText,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = APP_CONFIG.maxFileSize,
  onChange,
  preview,
  required,
  disabled,
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPreviewUrl(null);
      onChange?.(null);
      return;
    }

    // Validation de la taille
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      alert(`Fichier trop volumineux. Taille maximum : ${maxSizeMB} MB`);
      return;
    }

    // Validation du type
    const allowedTypes = accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      alert(`Type de fichier non accepté. Formats acceptés : ${accept}`);
      return;
    }

    // Créer preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange?.(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-2">
          <span className="text-[#8B4513] font-semibold text-sm sm:text-base">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
          ${isDragging ? 'border-[#D2691E] bg-[#D2691E]/10' : ''}
          ${error ? 'border-red-500' : 'border-[#D2691E]/30 hover:border-[#D2691E]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative">
            <motion.img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
              disabled={disabled}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📸</div>
            <p className="text-[#8B4513] font-semibold mb-1">
              Cliquez ou glissez votre photo
            </p>
            <p className="text-xs text-[#8B4513]/60">
              JPG, PNG, WEBP • Max {(maxSize / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="mt-1 text-xs text-[#8B4513]/60">{helperText}</p>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});
