import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ImageEditorProps {
  image: string;
  onSave: (croppedImage: Blob) => void;
  onCancel: () => void;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
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
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export default function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onSave(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-6xl flex-col bg-midnight p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-champagne">Edit Image</h2>
          <button
            onClick={onCancel}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne"
            aria-label="Close editor"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 rounded-2xl bg-black/40">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            objectFit="contain"
          />
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-4">
          {/* Zoom Control */}
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-blush"
            />
          </div>

          {/* Rotation Control */}
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
              <span>Rotation</span>
              <span>{rotation}°</span>
            </label>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-blush"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={resetTransforms}
              className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-champagne transition-colors hover:bg-white/10"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Reset</span>
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-white/20 px-6 py-3 text-champagne transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-full bg-blush px-6 py-3 font-semibold text-midnight transition-all hover:bg-champagne disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    <span>Save & Apply</span>
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
