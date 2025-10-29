import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchSettings, updateSettings, uploadLogo, SiteSettings } from '../../api/settings';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoText, setLogoText] = useState('');
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current settings
  const { isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSettings,
    onSuccess: (data: any) => {
      setLogoType((data.logoType || 'text') as 'text' | 'image');
      setLogoText(data.logoText || '');
      setLogoImageUrl(data.logoImageUrl || null);
      setPreviewImage(data.logoImageUrl || null);
    }
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (settings: Partial<SiteSettings>) => updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-site-settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const response = await uploadLogo(file);
      setLogoImageUrl(response.url);
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
      setPreviewImage(logoImageUrl); // Revert preview
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save
  const handleSave = () => {
    const settings: Partial<SiteSettings> = {
      logoType
    };

    if (logoType === 'text') {
      settings.logoText = logoText;
    } else if (logoType === 'image') {
      settings.logoImageUrl = logoImageUrl;
    }

    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-champagne mb-2">Site Settings</h1>
        <p className="text-champagne/60">Configure your site logo and branding</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-midnight/50 border border-champagne/20 rounded-lg p-6 space-y-6">
          {/* Logo Type Selection */}
          <div>
            <label className="block text-champagne font-semibold mb-3">Logo Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setLogoType('text')}
                className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                  logoType === 'text'
                    ? 'border-blush bg-blush/10 text-blush'
                    : 'border-champagne/20 text-champagne/60 hover:border-champagne/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📝</div>
                  <div className="font-semibold">Text Logo</div>
                  <div className="text-xs opacity-70">Use custom text</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLogoType('image')}
                className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                  logoType === 'image'
                    ? 'border-blush bg-blush/10 text-blush'
                    : 'border-champagne/20 text-champagne/60 hover:border-champagne/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🖼️</div>
                  <div className="font-semibold">Logo Image</div>
                  <div className="text-xs opacity-70">Upload an image</div>
                </div>
              </button>
            </div>
          </div>

          {/* Text Logo Configuration */}
          {logoType === 'text' && (
            <div>
              <label htmlFor="logoText" className="block text-champagne font-semibold mb-2">
                Logo Text
              </label>
              <input
                type="text"
                id="logoText"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder="Enter your brand name"
                className="w-full px-4 py-3 bg-midnight border border-champagne/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
              />
              <p className="text-champagne/50 text-sm mt-2">
                This text will appear in your site header
              </p>

              {/* Preview */}
              <div className="mt-4 p-4 bg-midnight border border-champagne/10 rounded-lg">
                <p className="text-champagne/60 text-xs mb-2">Preview:</p>
                <div className="text-2xl font-display text-champagne tracking-wider">
                  {logoText || 'Your Brand'}
                </div>
              </div>
            </div>
          )}

          {/* Image Logo Configuration */}
          {logoType === 'image' && (
            <div>
              <label className="block text-champagne font-semibold mb-2">Logo Image</label>

              {/* Preview */}
              {previewImage && (
                <div className="mb-4 p-4 bg-midnight border border-champagne/10 rounded-lg">
                  <p className="text-champagne/60 text-xs mb-2">Preview:</p>
                  <img
                    src={previewImage}
                    alt="Logo preview"
                    className="max-h-16 object-contain"
                  />
                </div>
              )}

              {/* Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-6 py-3 bg-champagne/10 border border-champagne/20 rounded-lg text-champagne hover:bg-champagne/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-champagne"></div>
                      Uploading...
                    </span>
                  ) : (
                    <span>{previewImage ? 'Change Logo' : 'Upload Logo'}</span>
                  )}
                </button>
                <p className="text-champagne/50 text-sm mt-2">
                  Recommended: PNG or SVG with transparent background. Max size: 5MB
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-champagne/10">
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="w-full px-6 py-3 bg-blush text-midnight rounded-lg font-semibold hover:bg-blush/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
