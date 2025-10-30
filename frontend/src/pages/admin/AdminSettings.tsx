import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  SparklesIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { fetchSettings, updateSettings, uploadLogo, SiteSettings } from '../../api/settings';
import api from '../../api/client';
import { OPENAI_MODELS, ANTHROPIC_MODELS, AIModel, getBadgeColor } from '../../data/aiModels';
import MediaSelector from '../../components/admin/MediaManager/MediaSelector';
import type { CMSMedia } from '../../api/media';

type TabType = 'general' | 'api-keys' | 'ai-settings';

interface APIKey {
  id: string;
  label: string;
  value: string;
  category: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

interface APIKeyCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  keys: Omit<APIKey, 'category'>[];
}

// Define all possible API keys an e-commerce platform might need
const API_KEY_CATEGORIES: APIKeyCategory[] = [
  {
    id: 'payment',
    name: 'Payment Gateways',
    description: 'Configure payment processing services',
    icon: '💳',
    keys: [
      {
        id: 'stripe_public_key',
        label: 'Stripe Publishable Key',
        value: '',
        placeholder: 'pk_live_...',
        helpText: 'Your Stripe public API key for client-side payment processing'
      },
      {
        id: 'stripe_secret_key',
        label: 'Stripe Secret Key',
        value: '',
        placeholder: 'sk_live_...',
        helpText: 'Your Stripe secret API key (keep this secure)',
        required: false
      },
      {
        id: 'stripe_webhook_secret',
        label: 'Stripe Webhook Secret',
        value: '',
        placeholder: 'whsec_...',
        helpText: 'Webhook signing secret for verifying Stripe events'
      },
      {
        id: 'paypal_client_id',
        label: 'PayPal Client ID',
        value: '',
        placeholder: 'AaBbCc...',
        helpText: 'Your PayPal REST API client ID'
      },
      {
        id: 'paypal_secret',
        label: 'PayPal Secret',
        value: '',
        placeholder: 'EFGHij...',
        helpText: 'Your PayPal REST API secret key'
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication Services',
    description: 'Email and SMS notification providers',
    icon: '📧',
    keys: [
      {
        id: 'twilio_account_sid',
        label: 'Twilio Account SID',
        value: '',
        placeholder: 'AC...',
        helpText: 'Your Twilio account identifier'
      },
      {
        id: 'twilio_auth_token',
        label: 'Twilio Auth Token',
        value: '',
        placeholder: 'Your auth token',
        helpText: 'Your Twilio authentication token'
      },
      {
        id: 'twilio_phone_number',
        label: 'Twilio Phone Number',
        value: '',
        placeholder: '+1234567890',
        helpText: 'Your Twilio SMS sender phone number'
      },
      {
        id: 'sendgrid_api_key',
        label: 'SendGrid API Key',
        value: '',
        placeholder: 'SG...',
        helpText: 'SendGrid API key for transactional emails'
      },
      {
        id: 'mailgun_api_key',
        label: 'Mailgun API Key',
        value: '',
        placeholder: 'key-...',
        helpText: 'Mailgun API key for email delivery'
      },
      {
        id: 'mailgun_domain',
        label: 'Mailgun Domain',
        value: '',
        placeholder: 'mg.yourdomain.com',
        helpText: 'Your verified Mailgun sending domain'
      }
    ]
  },
  {
    id: 'ai',
    name: 'AI & Machine Learning',
    description: 'AI services for enhanced features',
    icon: '🤖',
    keys: [
      {
        id: 'openai_api_key',
        label: 'OpenAI API Key',
        value: '',
        placeholder: 'sk-...',
        helpText: 'OpenAI API key for AI-powered product descriptions and chat'
      },
      {
        id: 'openai_organization_id',
        label: 'OpenAI Organization ID',
        value: '',
        placeholder: 'org-...',
        helpText: 'Your OpenAI organization identifier (optional)'
      },
      {
        id: 'anthropic_api_key',
        label: 'Anthropic (Claude) API Key',
        value: '',
        placeholder: 'sk-ant-...',
        helpText: 'Anthropic Claude API key for AI assistance'
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Tracking',
    description: 'Analytics and tracking services',
    icon: '📊',
    keys: [
      {
        id: 'google_analytics_id',
        label: 'Google Analytics Measurement ID',
        value: '',
        placeholder: 'G-XXXXXXXXXX',
        helpText: 'Google Analytics 4 measurement ID'
      },
      {
        id: 'google_analytics_api_secret',
        label: 'Google Analytics API Secret',
        value: '',
        placeholder: 'Your API secret',
        helpText: 'For Measurement Protocol API (optional)'
      },
      {
        id: 'facebook_pixel_id',
        label: 'Facebook Pixel ID',
        value: '',
        placeholder: '1234567890',
        helpText: 'Facebook Pixel ID for conversion tracking'
      },
      {
        id: 'tiktok_pixel_id',
        label: 'TikTok Pixel ID',
        value: '',
        placeholder: 'ABCDEFGH...',
        helpText: 'TikTok Pixel ID for ads tracking'
      },
      {
        id: 'mixpanel_token',
        label: 'Mixpanel Project Token',
        value: '',
        placeholder: 'abc123...',
        helpText: 'Mixpanel project token for user analytics'
      }
    ]
  },
  {
    id: 'shipping',
    name: 'Shipping & Logistics',
    description: 'Shipping rate calculation and tracking',
    icon: '📦',
    keys: [
      {
        id: 'shippo_api_key',
        label: 'Shippo API Token',
        value: '',
        placeholder: 'shippo_live_...',
        helpText: 'Shippo API token for shipping rates and labels'
      },
      {
        id: 'easypost_api_key',
        label: 'EasyPost API Key',
        value: '',
        placeholder: 'EZAK...',
        helpText: 'EasyPost API key for shipping services'
      },
      {
        id: 'shipstation_api_key',
        label: 'ShipStation API Key',
        value: '',
        placeholder: 'Your API key',
        helpText: 'ShipStation API key for order fulfillment'
      },
      {
        id: 'shipstation_api_secret',
        label: 'ShipStation API Secret',
        value: '',
        placeholder: 'Your API secret',
        helpText: 'ShipStation API secret'
      }
    ]
  },
  {
    id: 'storage',
    name: 'Storage & CDN',
    description: 'Cloud storage and content delivery',
    icon: '☁️',
    keys: [
      {
        id: 'aws_access_key_id',
        label: 'AWS Access Key ID',
        value: '',
        placeholder: 'AKIA...',
        helpText: 'AWS IAM access key for S3 and other services'
      },
      {
        id: 'aws_secret_access_key',
        label: 'AWS Secret Access Key',
        value: '',
        placeholder: 'Your secret key',
        helpText: 'AWS IAM secret access key'
      },
      {
        id: 'aws_s3_bucket',
        label: 'AWS S3 Bucket Name',
        value: '',
        placeholder: 'my-bucket',
        helpText: 'S3 bucket name for file storage'
      },
      {
        id: 'aws_region',
        label: 'AWS Region',
        value: '',
        placeholder: 'us-east-1',
        helpText: 'AWS region where your resources are located'
      },
      {
        id: 'cloudflare_api_token',
        label: 'Cloudflare API Token',
        value: '',
        placeholder: 'Your API token',
        helpText: 'Cloudflare API token for CDN and security'
      },
      {
        id: 'cloudflare_zone_id',
        label: 'Cloudflare Zone ID',
        value: '',
        placeholder: 'Your zone ID',
        helpText: 'Cloudflare Zone ID for your domain'
      }
    ]
  },
  {
    id: 'search',
    name: 'Search & Discovery',
    description: 'Product search and recommendations',
    icon: '🔍',
    keys: [
      {
        id: 'algolia_app_id',
        label: 'Algolia Application ID',
        value: '',
        placeholder: 'YourAppID',
        helpText: 'Algolia application identifier'
      },
      {
        id: 'algolia_api_key',
        label: 'Algolia Admin API Key',
        value: '',
        placeholder: 'Your admin API key',
        helpText: 'Algolia admin API key for indexing'
      },
      {
        id: 'algolia_search_key',
        label: 'Algolia Search-Only API Key',
        value: '',
        placeholder: 'Your search key',
        helpText: 'Public search-only API key'
      }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing Automation',
    description: 'Email marketing and customer engagement',
    icon: '📢',
    keys: [
      {
        id: 'klaviyo_api_key',
        label: 'Klaviyo API Key',
        value: '',
        placeholder: 'pk_...',
        helpText: 'Klaviyo API key for email marketing'
      },
      {
        id: 'mailchimp_api_key',
        label: 'Mailchimp API Key',
        value: '',
        placeholder: 'Your API key',
        helpText: 'Mailchimp API key for list management'
      },
      {
        id: 'hubspot_api_key',
        label: 'HubSpot API Key',
        value: '',
        placeholder: 'Your API key',
        helpText: 'HubSpot API key for CRM integration'
      }
    ]
  },
  {
    id: 'other',
    name: 'Other Services',
    description: 'Additional integrations and tools',
    icon: '🔧',
    keys: [
      {
        id: 'google_maps_api_key',
        label: 'Google Maps API Key',
        value: '',
        placeholder: 'AIza...',
        helpText: 'Google Maps API key for location services'
      },
      {
        id: 'recaptcha_site_key',
        label: 'reCAPTCHA Site Key',
        value: '',
        placeholder: '6Le...',
        helpText: 'Google reCAPTCHA v3 site key (public)'
      },
      {
        id: 'recaptcha_secret_key',
        label: 'reCAPTCHA Secret Key',
        value: '',
        placeholder: '6Le...',
        helpText: 'Google reCAPTCHA v3 secret key (private)'
      },
      {
        id: 'exchangerate_api_key',
        label: 'Exchange Rate API Key',
        value: '',
        placeholder: 'Your API key',
        helpText: 'API key for currency conversion rates'
      }
    ]
  }
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // General settings state
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoText, setLogoText] = useState('');
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [apiKeysSaved, setApiKeysSaved] = useState(false);

  // AI Settings state
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('openai');
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4o');
  const [anthropicModel, setAnthropicModel] = useState<string>('claude-sonnet-4-5-20250929');

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSettings
  });

  // Update state when settings data changes
  React.useEffect(() => {
    if (settingsData) {
      setLogoType((settingsData.logoType || 'text') as 'text' | 'image');
      setLogoText(settingsData.logoText || '');
      setLogoImageUrl(settingsData.logoImageUrl || null);
      setPreviewImage(settingsData.logoImageUrl || null);
      setAiProvider((settingsData.aiProvider || 'openai') as 'openai' | 'anthropic');
      setOpenaiModel(settingsData.openaiModel || 'gpt-4o');
      setAnthropicModel(settingsData.anthropicModel || 'claude-sonnet-4-5-20250929');
    }
  }, [settingsData]);

  // Fetch API keys
  const { data: apiKeysData, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await api.get('/admin/api-keys');
      return response.data;
    },
    enabled: activeTab === 'api-keys',
    retry: false
  });

  // Update API keys state when data changes
  React.useEffect(() => {
    if (apiKeysData) {
      setApiKeys(apiKeysData || {});
    }
  }, [apiKeysData]);

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

  // Save API keys mutation
  const saveApiKeysMutation = useMutation({
    mutationFn: async (keys: Record<string, string>) => {
      const response = await api.put('/admin/api-keys', { keys });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setApiKeysSaved(true);
      toast.success('API keys saved successfully!');
      setTimeout(() => setApiKeysSaved(false), 3000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save API keys');
    }
  });

  // Handle file selection
  // Handle media selection from library
  const handleSelectLogoFromLibrary = (media: CMSMedia | CMSMedia[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media;
    setLogoImageUrl(selectedMedia.url);
    setPreviewImage(selectedMedia.url);
    toast.success('Logo selected successfully!');
  };

  // Handle save general settings
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

  // Handle save API keys
  const handleSaveAPIKeys = () => {
    // Filter out empty keys
    const keysToSave = Object.entries(apiKeys).reduce((acc, [key, value]) => {
      if (value && value.trim()) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    saveApiKeysMutation.mutate(keysToSave);
  };

  // Handle save AI settings
  const handleSaveAISettings = () => {
    updateMutation.mutate({
      aiProvider,
      openaiModel,
      anthropicModel
    });
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  // Copy key to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Clear a specific key
  const clearKey = (keyId: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyId]: ''
    }));
  };

  // Mask API key for display
  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings — Luxia Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl text-champagne">Settings</h1>
          <p className="mt-1 text-sm text-champagne/70">
            Configure your site settings and integrations
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: 'general', label: 'General', icon: Cog6ToothIcon },
            { id: 'api-keys', label: 'API Keys', icon: KeyIcon },
            { id: 'ai-settings', label: 'AI Settings', icon: SparklesIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-champagne'
                    : 'text-champagne/50 hover:text-champagne/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blush"
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                {/* Logo Type Selection */}
                <div>
                  <label className="block text-champagne font-semibold mb-3">Logo Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setLogoType('text')}
                      className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all ${
                        logoType === 'text'
                          ? 'border-blush bg-blush/10 text-blush'
                          : 'border-white/20 text-champagne/60 hover:border-white/40'
                      }`}
                    >
                      <div className="text-3xl mb-2">📝</div>
                      <div className="font-semibold">Text Logo</div>
                      <div className="text-xs opacity-70 mt-1">Use custom text</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogoType('image')}
                      className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all ${
                        logoType === 'image'
                          ? 'border-blush bg-blush/10 text-blush'
                          : 'border-white/20 text-champagne/60 hover:border-white/40'
                      }`}
                    >
                      <div className="text-3xl mb-2">🖼️</div>
                      <div className="font-semibold">Logo Image</div>
                      <div className="text-xs opacity-70 mt-1">Upload an image</div>
                    </button>
                  </div>
                </div>

                {/* Text Logo Configuration */}
                {logoType === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="logoText" className="block text-champagne font-semibold mb-2">
                      Logo Text
                    </label>
                    <input
                      type="text"
                      id="logoText"
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      placeholder="Enter your brand name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-champagne placeholder-champagne/40 focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                    />
                    <p className="text-champagne/60 text-sm mt-2">
                      This text will appear in your site header
                    </p>

                    {/* Preview */}
                    <div className="mt-4 p-6 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-champagne/60 text-xs mb-3 uppercase tracking-wider">Preview:</p>
                      <div className="text-3xl font-display text-champagne tracking-wider">
                        {logoText || 'Your Brand'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Image Logo Configuration */}
                {logoType === 'image' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-champagne font-semibold mb-2">Logo Image</label>

                    {/* Preview */}
                    {previewImage && (
                      <div className="mb-4 p-6 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-champagne/60 text-xs mb-3 uppercase tracking-wider">Preview:</p>
                        <img
                          src={previewImage}
                          alt="Logo preview"
                          className="max-h-20 object-contain"
                        />
                      </div>
                    )}

                    {/* Select from Media Library Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowMediaSelector(true)}
                        className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-champagne hover:bg-white/20 transition-colors flex items-center gap-2"
                      >
                        <PhotoIcon className="h-5 w-5" />
                        <span>{previewImage ? 'Change Logo' : 'Select Logo from Media Library'}</span>
                      </button>
                      <p className="text-champagne/60 text-sm mt-2">
                        Select an image from your media library to use as your site logo
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Save Button */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="w-full px-6 py-3 bg-blush text-midnight rounded-full font-semibold hover:bg-champagne transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* API Keys */}
          {activeTab === 'api-keys' && (
            <motion.div
              key="api-keys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Security Notice */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-400">Security Notice</h3>
                    <p className="text-sm text-amber-400/80 mt-1">
                      API keys are encrypted and stored securely. Only save production keys when ready to go live. Never share your API keys publicly.
                    </p>
                  </div>
                </div>
              </div>

              {apiKeysLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {API_KEY_CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-6"
                    >
                      {/* Category Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{category.icon}</span>
                          <h3 className="text-xl font-display text-champagne">{category.name}</h3>
                        </div>
                        <p className="text-sm text-champagne/60">{category.description}</p>
                      </div>

                      {/* Keys */}
                      <div className="space-y-4">
                        {category.keys.map((key) => {
                          const keyId = key.id;
                          const value = apiKeys[keyId] || '';
                          const isVisible = visibleKeys.has(keyId);

                          return (
                            <div key={keyId} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-semibold text-champagne">
                                  {key.label}
                                  {key.required && (
                                    <span className="text-rose-400">*</span>
                                  )}
                                </label>
                                {value && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(value)}
                                      className="rounded-lg p-1.5 text-champagne/60 hover:bg-white/10 hover:text-champagne transition-colors"
                                      title="Copy to clipboard"
                                    >
                                      <DocumentDuplicateIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => clearKey(keyId)}
                                      className="rounded-lg p-1.5 text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                      title="Clear key"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="relative">
                                <input
                                  type={isVisible ? 'text' : 'password'}
                                  value={value}
                                  onChange={(e) => setApiKeys(prev => ({
                                    ...prev,
                                    [keyId]: e.target.value
                                  }))}
                                  placeholder={key.placeholder}
                                  className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-xl text-champagne placeholder-champagne/40 font-mono text-sm focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleKeyVisibility(keyId)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-champagne/60 hover:text-champagne transition-colors"
                                  title={isVisible ? 'Hide key' : 'Show key'}
                                >
                                  {isVisible ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                  ) : (
                                    <EyeIcon className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                              {key.helpText && (
                                <p className="text-xs text-champagne/60">{key.helpText}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Save Button */}
                  <div className="sticky bottom-6 rounded-2xl border border-white/10 bg-midnight/95 p-4 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {apiKeysSaved && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2 text-sm text-emerald-400"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Keys saved securely</span>
                          </motion.div>
                        )}
                      </div>
                      <button
                        onClick={handleSaveAPIKeys}
                        disabled={saveApiKeysMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-blush text-midnight rounded-full font-semibold hover:bg-champagne transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saveApiKeysMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-midnight"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-5 w-5" />
                            Save API Keys
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai-settings' && (
            <motion.div
              key="ai-settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl space-y-6"
            >
              {/* AI Provider Configuration */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-display text-champagne mb-2">AI Provider & Model Configuration</h2>
                  <p className="text-sm text-champagne/60">
                    Choose your preferred AI provider and specific model for generating product descriptions, SEO metadata, and other AI-powered features.
                  </p>
                </div>

                {/* Provider Selection */}
                <div className="space-y-6">
                  {/* OpenAI Provider Card */}
                  <div
                    className={`rounded-2xl border-2 transition-all ${
                      aiProvider === 'openai'
                        ? 'border-blush bg-blush/10'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAiProvider('openai')}
                      className="w-full text-left p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">🤖</div>
                          <div>
                            <h3 className="text-xl font-display text-champagne mb-1 flex items-center gap-2">
                              OpenAI
                              {aiProvider === 'openai' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blush">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Active
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-champagne/60">Industry-leading language models</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Model Selector for OpenAI */}
                    <div className={`px-6 pb-6 space-y-3 transition-opacity ${
                      aiProvider !== 'openai' ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <label className="block text-sm font-semibold text-champagne mb-2">
                        Select Model:
                      </label>
                      <div className="space-y-2">
                        {OPENAI_MODELS.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => aiProvider === 'openai' && setOpenaiModel(model.id)}
                            disabled={aiProvider !== 'openai'}
                            className={`w-full text-left rounded-xl border transition-all ${
                              openaiModel === model.id && aiProvider === 'openai'
                                ? 'border-blush bg-blush/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            } ${aiProvider !== 'openai' ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-champagne">{model.name}</h4>
                                    {model.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(model.badge)}`}>
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-champagne/60">{model.description}</p>
                                </div>
                                {openaiModel === model.id && aiProvider === 'openai' && (
                                  <CheckCircleIcon className="h-5 w-5 text-blush flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="bg-white/5 rounded px-2 py-1">
                                  <div className="text-xs text-champagne/50">Input</div>
                                  <div className="text-xs font-medium text-champagne">${model.pricing.input}/M</div>
                                </div>
                                <div className="bg-white/5 rounded px-2 py-1">
                                  <div className="text-xs text-champagne/50">Output</div>
                                  <div className="text-xs font-medium text-champagne">${model.pricing.output}/M</div>
                                </div>
                                <div className="bg-white/5 rounded px-2 py-1">
                                  <div className="text-xs text-champagne/50">Context</div>
                                  <div className="text-xs font-medium text-champagne">{model.contextWindow}</div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Anthropic Provider Card */}
                  <div
                    className={`rounded-2xl border-2 transition-all ${
                      aiProvider === 'anthropic'
                        ? 'border-blush bg-blush/10'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAiProvider('anthropic')}
                      className="w-full text-left p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">🧠</div>
                          <div>
                            <h3 className="text-xl font-display text-champagne mb-1 flex items-center gap-2">
                              Anthropic Claude
                              {aiProvider === 'anthropic' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blush">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Active
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-champagne/60">Advanced AI with superior reasoning</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Model Selector for Anthropic */}
                    <div className={`px-6 pb-6 space-y-3 transition-opacity ${
                      aiProvider !== 'anthropic' ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <label className="block text-sm font-semibold text-champagne mb-2">
                        Select Model:
                      </label>
                      <div className="space-y-2">
                        {ANTHROPIC_MODELS.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => aiProvider === 'anthropic' && setAnthropicModel(model.id)}
                            disabled={aiProvider !== 'anthropic'}
                            className={`w-full text-left rounded-xl border transition-all ${
                              anthropicModel === model.id && aiProvider === 'anthropic'
                                ? 'border-blush bg-blush/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            } ${aiProvider !== 'anthropic' ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-champagne">{model.name}</h4>
                                    {model.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(model.badge)}`}>
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-champagne/60">{model.description}</p>
                                </div>
                                {anthropicModel === model.id && aiProvider === 'anthropic' && (
                                  <CheckCircleIcon className="h-5 w-5 text-blush flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="bg-white/5 rounded px-2 py-1">
                                  <div className="text-xs text-champagne/50">Input</div>
                                  <div className="text-xs font-medium text-champagne">${model.pricing.input}/M</div>
                                </div>
                                <div className="bg-white/5 rounded px-2 py-1">
                                  <div className="text-xs text-champagne/50">Output</div>
                                  <div className="text-xs font-medium text-champagne">${model.pricing.output}/M</div>
                                </div>
                                <div className="bg-white/5 rounded px-2 py-1">
                                  <div className="text-xs text-champagne/50">Context</div>
                                  <div className="text-xs font-medium text-champagne">{model.contextWindow}</div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-1">Important Notes</h4>
                      <ul className="text-sm text-blue-400/80 space-y-1">
                        <li>• Configure API keys in the API Keys tab before using AI features</li>
                        <li>• The active provider and model are used for all AI operations</li>
                        <li>• Pricing shown is per 1 million tokens (input/output)</li>
                        <li>• Changes take effect immediately for new AI operations</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={handleSaveAISettings}
                    disabled={updateMutation.isPending}
                    className="w-full px-6 py-3 bg-blush text-midnight rounded-full font-semibold hover:bg-champagne transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-midnight"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5" />
                        Save AI Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleSelectLogoFromLibrary}
        multiple={false}
        title="Select Logo Image"
        description="Choose an image from your media library to use as your site logo"
      />
    </>
  );
}
