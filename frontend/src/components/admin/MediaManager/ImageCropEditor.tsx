import { useState, useCallback, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ImageCropEditorProps {
  imageUrl: string;
  imageName: string;
  onSave: (croppedImage: Blob, cropData: CropData) => void | Promise<void>;
  onClose: () => void;
  initialAspectRatio?: number | null;
}

export interface CropData {
  crop: Point;
  zoom: number;
  rotation: number;
  aspect: number | null;
  croppedAreaPixels: Area;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '21:9', value: 21 / 9 }
];

export default function ImageCropEditor({
  imageUrl,
  imageName,
  onSave,
  onClose,
  initialAspectRatio = null
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | null>(initialAspectRatio);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImage = useCallback(
    async (imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> => {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.putImageData(
        data,
        0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
        0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/jpeg', 0.95);
      });
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImage(imageUrl, croppedAreaPixels, rotation);

      const cropData: CropData = {
        crop,
        zoom,
        rotation,
        aspect,
        croppedAreaPixels
      };

      await onSave(croppedImage, cropData);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/95 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-7xl flex-col p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-champagne">Crop Image</h2>
            <p className="mt-1 text-sm text-champagne/60">{imageName}</p>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative mb-4 flex-1 overflow-hidden rounded-xl bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect || undefined}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            objectFit="contain"
            style={{
              containerStyle: {
                backgroundColor: '#000'
              },
              cropAreaStyle: {
                border: '2px solid #E8D5C4'
              }
            }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-midnight/50 p-4">
          {/* Aspect Ratio */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
              Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => setAspect(ratio.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    aspect === ratio.value
                      ? 'bg-blush text-midnight'
                      : 'border border-white/20 bg-white/5 text-champagne hover:border-blush hover:bg-white/10'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-champagne/60">
                Zoom
              </label>
              <span className="text-sm text-champagne">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <MagnifyingGlassMinusIcon className="h-5 w-5 text-champagne/40" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <MagnifyingGlassPlusIcon className="h-5 w-5 text-champagne/40" />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-champagne/60">
                Rotation
              </label>
              <span className="text-sm text-champagne">{rotation}°</span>
            </div>
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="h-5 w-5 text-champagne/40" />
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1"
              />
              <ArrowPathIcon className="h-5 w-5 rotate-180 text-champagne/40" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-champagne transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
            >
              Reset
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-champagne transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !croppedAreaPixels}
                className="flex items-center gap-2 rounded-full bg-blush px-6 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-midnight/30 border-t-midnight" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Save Crop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to create image element from URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
