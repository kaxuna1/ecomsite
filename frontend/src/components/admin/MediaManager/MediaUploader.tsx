import { useState, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadMedia } from '../../../api/media';

interface MediaUploaderProps {
  onUploadComplete?: () => void;
  categoryId?: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function MediaUploader({ onUploadComplete, categoryId }: MediaUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onUploadComplete?.();
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      handleFiles(files);
    }
  }, [categoryId]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      handleFiles(files);
    }
  }, [categoryId]);

  const handleFiles = async (files: File[]) => {
    const newUploads: UploadProgress[] = files.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadIndex = uploads.length + i;

      try {
        setUploads((prev) => {
          const updated = [...prev];
          updated[uploadIndex] = { ...updated[uploadIndex], status: 'uploading', progress: 50 };
          return updated;
        });

        await uploadMutation.mutateAsync(file, {
          altText: file.name.split('.')[0],
          categoryId
        });

        setUploads((prev) => {
          const updated = [...prev];
          updated[uploadIndex] = { ...updated[uploadIndex], status: 'success', progress: 100 };
          return updated;
        });

        // Remove successful upload after 2 seconds
        setTimeout(() => {
          setUploads((prev) => prev.filter((_, idx) => idx !== uploadIndex));
        }, 2000);
      } catch (error: any) {
        setUploads((prev) => {
          const updated = [...prev];
          updated[uploadIndex] = {
            ...updated[uploadIndex],
            status: 'error',
            error: error.message || 'Upload failed'
          };
          return updated;
        });
      }
    }
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-all ${
          dragActive
            ? 'border-blush bg-blush/10 scale-[1.02]'
            : 'border-white/20 bg-white/5 hover:border-blush hover:bg-white/10'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <CloudArrowUpIcon
          className={`h-16 w-16 transition-colors ${
            dragActive ? 'text-blush' : 'text-champagne/40'
          }`}
        />

        <p className="mt-4 text-center text-sm font-medium text-champagne/70">
          {dragActive ? 'Drop files here' : 'Drag & drop images here, or click to browse'}
        </p>

        <p className="mt-2 text-center text-xs text-champagne/40">
          PNG, JPG, WebP, GIF, AVIF up to 10MB
        </p>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
            >
              {/* Thumbnail or Icon */}
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-white/10">
                {upload.file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(upload.file)}
                    alt={upload.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <CloudArrowUpIcon className="h-6 w-6 text-champagne/40" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-champagne">{upload.file.name}</p>
                <div className="mt-1">
                  {upload.status === 'pending' && (
                    <p className="text-xs text-champagne/60">Waiting...</p>
                  )}
                  {upload.status === 'uploading' && (
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-blush transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.status === 'success' && (
                    <p className="text-xs font-semibold text-green-400">Uploaded successfully</p>
                  )}
                  {upload.status === 'error' && (
                    <p className="text-xs font-semibold text-rose-400">
                      {upload.error || 'Upload failed'}
                    </p>
                  )}
                </div>
              </div>

              {/* Remove Button */}
              {(upload.status === 'error' || upload.status === 'pending') && (
                <button
                  onClick={() => removeUpload(index)}
                  className="flex-shrink-0 rounded-full p-1 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
