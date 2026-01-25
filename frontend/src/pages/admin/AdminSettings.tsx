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
  PhotoIcon,
  DocumentTextIcon,
  CreditCardIcon,
  EnvelopeIcon,
  CpuChipIcon,
  ChartBarIcon,
  TruckIcon,
  CloudIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { fetchSettings, updateSettings, uploadLogo, SiteSettings } from '../../api/settings';
import api from '../../api/client';
import { OPENAI_MODELS, ANTHROPIC_MODELS, GEMINI_MODELS, AIModel, getBadgeColor } from '../../data/aiModels';
import MediaSelector from '../../components/admin/MediaManager/MediaSelector';
import type { CMSMedia } from '../../api/media';
import SaveButton from '../../components/admin/SaveButton';
import PageHeader from '../../components/admin/PageHeader';

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
  icon: string; // Keep for backward compatibility, but we'll use getCategoryIcon instead
  keys: Omit<APIKey, 'category'>[];
}

// Helper function to get the icon component for each category
const getCategoryIcon = (categoryId: string) => {
  const iconProps = { className: 'h-8 w-8' };
  switch (categoryId) {
    case 'payment':
      return <CreditCardIcon {...iconProps} />;
    case 'communication':
      return <EnvelopeIcon {...iconProps} />;
    case 'ai':
      return <CpuChipIcon {...iconProps} />;
    case 'analytics':
      return <ChartBarIcon {...iconProps} />;
    case 'shipping':
      return <TruckIcon {...iconProps} />;
    case 'storage':
      return <CloudIcon {...iconProps} />;
    case 'cdn':
      return <ShieldCheckIcon {...iconProps} />;
    case 'search':
      return <MagnifyingGlassIcon {...iconProps} />;
    case 'marketing':
      return <MegaphoneIcon {...iconProps} />;
    case 'other':
      return <WrenchScrewdriverIcon {...iconProps} />;
    default:
      return <Cog6ToothIcon {...iconProps} />;
  }
};

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
      },
      {
        id: 'gemini_api_key',
        label: 'Gemini API Key',
        value: '',
        placeholder: 'AIza...',
        helpText: 'Google Gemini API key from Google AI Studio'
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
    name: 'S3 Storage (Required)',
    description: 'Configure S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO, etc.)',
    icon: '☁️',
    keys: [
      {
        id: 's3_access_key',
        label: 'Access Key ID',
        value: '',
        placeholder: 'AKIA... or your provider key',
        helpText: 'Access key for S3-compatible storage',
        required: true
      },
      {
        id: 's3_secret_key',
        label: 'Secret Access Key',
        value: '',
        placeholder: 'Your secret key',
        helpText: 'Secret access key for S3-compatible storage',
        required: true
      },
      {
        id: 's3_endpoint',
        label: 'Endpoint URL',
        value: '',
        placeholder: 'https://s3.amazonaws.com or https://nyc3.digitaloceanspaces.com',
        helpText: 'S3 endpoint URL. Use your provider\'s endpoint (e.g., https://nyc3.digitaloceanspaces.com for DigitalOcean)',
        required: true
      },
      {
        id: 's3_region',
        label: 'Region',
        value: '',
        placeholder: 'us-east-1 or nyc3',
        helpText: 'Region for your S3 bucket (e.g., us-east-1 for AWS, nyc3 for DigitalOcean)',
        required: true
      },
      {
        id: 's3_bucket',
        label: 'Bucket Name',
        value: '',
        placeholder: 'my-bucket',
        helpText: 'Name of your S3 bucket',
        required: true
      },
      {
        id: 's3_public_url',
        label: 'Public URL (Optional)',
        value: '',
        placeholder: 'https://cdn.example.com',
        helpText: 'Custom CDN URL for serving files (leave empty to use default S3 URLs)'
      }
    ]
  },
  {
    id: 'cdn',
    name: 'CDN & Security',
    description: 'Content delivery and security services',
    icon: '🛡️',
    keys: [
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

  // S3 Storage state
  const [s3Testing, setS3Testing] = useState(false);
  const [s3TestResult, setS3TestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [storageStatus, setStorageStatus] = useState<{ configured: boolean; provider: string | null; bucket: string | null } | null>(null);

  // AI Settings state
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4o');
  const [anthropicModel, setAnthropicModel] = useState<string>('claude-sonnet-4-5-20250929');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3-flash-preview');

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
      setAiProvider((settingsData.aiProvider || 'openai') as 'openai' | 'anthropic' | 'gemini');
      setOpenaiModel(settingsData.openaiModel || 'gpt-4o');
      setAnthropicModel(settingsData.anthropicModel || 'claude-sonnet-4-5-20250929');
      setGeminiModel(settingsData.geminiModel || 'gemini-3-flash-preview');
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
    // Filter out empty keys AND masked keys (containing • bullet character)
    const keysToSave = Object.entries(apiKeys).reduce((acc, [key, value]) => {
      // Only include keys that:
      // 1. Have a value
      // 2. Are not empty/whitespace
      // 3. Do NOT contain masked bullet characters (•)
      if (value && value.trim() && !value.includes('•')) {
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
      anthropicModel,
      geminiModel
    });
  };

  // Test S3 connection
  const handleTestS3Connection = async () => {
    setS3Testing(true);
    setS3TestResult(null);
    
    try {
      const response = await api.post('/admin/api-keys/test-s3');
      setS3TestResult(response.data);
      
      if (response.data.success) {
        toast.success('S3 connection successful!');
        // Refresh storage status
        fetchStorageStatus();
      } else {
        toast.error(response.data.message || 'S3 connection failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to test S3 connection';
      setS3TestResult({ success: false, message });
      toast.error(message);
    } finally {
      setS3Testing(false);
    }
  };

  // Fetch storage status
  const fetchStorageStatus = async () => {
    try {
      const response = await api.get('/admin/api-keys/storage-status');
      setStorageStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch storage status:', error);
    }
  };

  // Fetch storage status on mount and when API keys tab is active
  React.useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchStorageStatus();
    }
  }, [activeTab]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings — Luxia Admin</title>
      </Helmet>

      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure your site settings and integrations"
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-default">
          {[
            { id: 'general', label: 'General', icon: Cog6ToothIcon },
            { id: 'api-keys', label: 'API Keys', icon: KeyIcon },
            { id: 'ai-settings', label: 'AI Settings', icon: SparklesIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
              <div className="rounded-2xl border border-border-default bg-bg-elevated p-6 space-y-6">
                {/* Logo Type Selection */}
                <div>
                  <label className="block text-text-primary font-semibold mb-3">Logo Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setLogoType('text')}
                      className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all ${
                        logoType === 'text'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border-default text-text-secondary hover:border-border-default'
                      }`}
                    >
                      <DocumentTextIcon className="h-8 w-8 mb-2" />
                      <div className="font-semibold">Text Logo</div>
                      <div className="text-xs opacity-70 mt-1">Use custom text</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogoType('image')}
                      className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all ${
                        logoType === 'image'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border-default text-text-secondary hover:border-border-default'
                      }`}
                    >
                      <PhotoIcon className="h-8 w-8 mb-2" />
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
                    <label htmlFor="logoText" className="block text-text-primary font-semibold mb-2">
                      Logo Text
                    </label>
                    <input
                      type="text"
                      id="logoText"
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      placeholder="Enter your brand name"
                      className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                    <p className="text-text-secondary text-sm mt-2">
                      This text will appear in your site header
                    </p>

                    {/* Preview */}
                    <div className="mt-4 p-6 bg-bg-secondary border border-border-default rounded-xl">
                      <p className="text-text-secondary text-xs mb-3 uppercase tracking-wider">Preview:</p>
                      <div className="text-3xl font-display text-text-primary tracking-wider">
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
                    <label className="block text-text-primary font-semibold mb-2">Logo Image</label>

                    {/* Preview */}
                    {previewImage && (
                      <div className="mb-4 p-6 bg-bg-secondary border border-border-default rounded-xl">
                        <p className="text-text-secondary text-xs mb-3 uppercase tracking-wider">Preview:</p>
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
                        className="px-6 py-3 bg-bg-secondary border border-border-default rounded-xl text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2"
                      >
                        <PhotoIcon className="h-5 w-5" />
                        <span>{previewImage ? 'Change Logo' : 'Select Logo from Media Library'}</span>
                      </button>
                      <p className="text-text-secondary text-sm mt-2">
                        Select an image from your media library to use as your site logo
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Save Button */}
                <div className="pt-4 border-t border-border-default">
                  <SaveButton
                    fullWidth
                    onClick={handleSave}
                    isLoading={updateMutation.isPending}
                    isSuccess={updateMutation.isSuccess}
                    loadingText="Saving..."
                    successText="Settings Saved!"
                  >
                    Save Settings
                  </SaveButton>
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {API_KEY_CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-border-default bg-bg-elevated p-6"
                    >
                      {/* Category Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          {getCategoryIcon(category.id)}
                          <h3 className="text-xl font-display text-text-primary">{category.name}</h3>
                        </div>
                        <p className="text-sm text-text-secondary">{category.description}</p>
                      </div>

                      {/* Storage Status Banner (only for storage category) */}
                      {category.id === 'storage' && (
                        <div className={`mb-4 p-4 rounded-xl border ${
                          storageStatus?.configured 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              storageStatus?.configured 
                                ? 'bg-emerald-500/20' 
                                : 'bg-amber-500/20'
                            }`}>
                              {storageStatus?.configured ? (
                                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${
                                storageStatus?.configured 
                                  ? 'text-emerald-400' 
                                  : 'text-amber-400'
                              }`}>
                                {storageStatus?.configured 
                                  ? `Connected to ${storageStatus.provider}` 
                                  : 'S3 Storage Not Configured'}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {storageStatus?.configured 
                                  ? `Bucket: ${storageStatus.bucket}` 
                                  : 'Configure S3 storage to enable file uploads'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Keys */}
                      <div className="space-y-4">
                        {category.keys.map((key) => {
                          const keyId = key.id;
                          const value = apiKeys[keyId] || '';
                          const isVisible = visibleKeys.has(keyId);

                          return (
                            <div key={keyId} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
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
                                      className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
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
                                  className="w-full px-4 py-2.5 pr-12 bg-bg-elevated border border-border-default rounded-xl text-text-primary placeholder:text-text-tertiary font-mono text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleKeyVisibility(keyId)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
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
                                <p className="text-xs text-text-secondary">{key.helpText}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Test Connection Button (only for storage category) */}
                      {category.id === 'storage' && (
                        <div className="mt-6 pt-4 border-t border-border-default">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-text-primary">Test Connection</p>
                              <p className="text-xs text-text-secondary">
                                Save your credentials first, then test the connection
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleTestS3Connection}
                              disabled={s3Testing}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                s3Testing
                                  ? 'bg-bg-secondary text-text-secondary cursor-not-allowed'
                                  : 'bg-primary/20 text-primary hover:bg-primary/30'
                              }`}
                            >
                              {s3Testing ? (
                                <span className="flex items-center gap-2">
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  Testing...
                                </span>
                              ) : (
                                'Test S3 Connection'
                              )}
                            </button>
                          </div>
                          
                          {/* Test Result */}
                          {s3TestResult && (
                            <div className={`mt-3 p-3 rounded-lg ${
                              s3TestResult.success 
                                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}>
                              <div className="flex items-center gap-2">
                                {s3TestResult.success ? (
                                  <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                                ) : (
                                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                )}
                                <p className={`text-sm ${
                                  s3TestResult.success ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {s3TestResult.message}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Save Button */}
                  <div className="sticky bottom-6 rounded-2xl border border-border-default bg-bg-elevated/95 p-4 shadow-2xl backdrop-blur-sm">
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
                      <SaveButton
                        onClick={handleSaveAPIKeys}
                        isLoading={saveApiKeysMutation.isPending}
                        isSuccess={apiKeysSaved}
                        loadingText="Saving..."
                        successText="Keys Saved!"
                      >
                        <>
                          <ShieldCheckIcon className="h-5 w-5" />
                          Save API Keys
                        </>
                      </SaveButton>
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
              <div className="rounded-2xl border border-border-default bg-bg-elevated p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-display text-text-primary mb-2">AI Provider & Model Configuration</h2>
                  <p className="text-sm text-text-secondary">
                    Choose your preferred AI provider and specific model for generating product descriptions, SEO metadata, and other AI-powered features.
                  </p>
                </div>

                {/* Provider Selection */}
                <div className="space-y-6">
                  {/* OpenAI Provider Card */}
                  <div
                    className={`rounded-2xl border-2 transition-all ${
                      aiProvider === 'openai'
                        ? 'border-primary bg-primary/10'
                        : 'border-border-default bg-bg-secondary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAiProvider('openai')}
                      className="w-full text-left p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <CpuChipIcon className="h-10 w-10" />
                          <div>
                            <h3 className="text-xl font-display text-text-primary mb-1 flex items-center gap-2">
                              OpenAI
                              {aiProvider === 'openai' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Active
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-text-secondary">Industry-leading language models</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Model Selector for OpenAI */}
                    <div className={`px-6 pb-6 space-y-3 transition-opacity ${
                      aiProvider !== 'openai' ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
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
                                ? 'border-primary bg-primary/10'
                                : 'border-border-default bg-bg-secondary hover:border-border-default hover:bg-bg-elevated'
                            } ${aiProvider !== 'openai' ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-text-primary">{model.name}</h4>
                                    {model.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(model.badge)}`}>
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-text-secondary">{model.description}</p>
                                </div>
                                {openaiModel === model.id && aiProvider === 'openai' && (
                                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Input</div>
                                  <div className="text-xs font-medium text-text-primary">${model.pricing.input}/M</div>
                                </div>
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Output</div>
                                  <div className="text-xs font-medium text-text-primary">${model.pricing.output}/M</div>
                                </div>
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Context</div>
                                  <div className="text-xs font-medium text-text-primary">{model.contextWindow}</div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gemini Provider Card */}
                  <div
                    className={`rounded-2xl border-2 transition-all ${
                      aiProvider === 'gemini'
                        ? 'border-primary bg-primary/10'
                        : 'border-border-default bg-bg-secondary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAiProvider('gemini')}
                      className="w-full text-left p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <SparklesIcon className="h-10 w-10" />
                          <div>
                            <h3 className="text-xl font-display text-text-primary mb-1 flex items-center gap-2">
                              Google Gemini
                              {aiProvider === 'gemini' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Active
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-text-secondary">Fast, capable multimodal models</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Model Selector for Gemini */}
                    <div className={`px-6 pb-6 space-y-3 transition-opacity ${
                      aiProvider !== 'gemini' ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Select Model:
                      </label>
                      <div className="space-y-2">
                        {GEMINI_MODELS.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => aiProvider === 'gemini' && setGeminiModel(model.id)}
                            disabled={aiProvider !== 'gemini'}
                            className={`w-full text-left rounded-xl border transition-all ${
                              geminiModel === model.id && aiProvider === 'gemini'
                                ? 'border-primary bg-primary/10'
                                : 'border-border-default bg-bg-secondary hover:border-border-default hover:bg-bg-elevated'
                            } ${aiProvider !== 'gemini' ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-text-primary">{model.name}</h4>
                                    {model.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(model.badge)}`}>
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-text-secondary">{model.description}</p>
                                </div>
                                {geminiModel === model.id && aiProvider === 'gemini' && (
                                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Input</div>
                                  <div className="text-xs font-medium text-text-primary">${model.pricing.input}/M</div>
                                </div>
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Output</div>
                                  <div className="text-xs font-medium text-text-primary">${model.pricing.output}/M</div>
                                </div>
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Context</div>
                                  <div className="text-xs font-medium text-text-primary">{model.contextWindow}</div>
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
                        ? 'border-primary bg-primary/10'
                        : 'border-border-default bg-bg-secondary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAiProvider('anthropic')}
                      className="w-full text-left p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <CpuChipIcon className="h-10 w-10" />
                          <div>
                            <h3 className="text-xl font-display text-text-primary mb-1 flex items-center gap-2">
                              Anthropic Claude
                              {aiProvider === 'anthropic' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Active
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-text-secondary">Advanced AI with superior reasoning</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Model Selector for Anthropic */}
                    <div className={`px-6 pb-6 space-y-3 transition-opacity ${
                      aiProvider !== 'anthropic' ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
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
                                ? 'border-primary bg-primary/10'
                                : 'border-border-default bg-bg-secondary hover:border-border-default hover:bg-bg-elevated'
                            } ${aiProvider !== 'anthropic' ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-text-primary">{model.name}</h4>
                                    {model.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(model.badge)}`}>
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-text-secondary">{model.description}</p>
                                </div>
                                {anthropicModel === model.id && aiProvider === 'anthropic' && (
                                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Input</div>
                                  <div className="text-xs font-medium text-text-primary">${model.pricing.input}/M</div>
                                </div>
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Output</div>
                                  <div className="text-xs font-medium text-text-primary">${model.pricing.output}/M</div>
                                </div>
                                <div className="bg-bg-secondary rounded px-2 py-1">
                                  <div className="text-xs text-text-tertiary">Context</div>
                                  <div className="text-xs font-medium text-text-primary">{model.contextWindow}</div>
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
                <div className="mt-6 pt-6 border-t border-border-default">
                  <SaveButton
                    fullWidth
                    onClick={handleSaveAISettings}
                    isLoading={updateMutation.isPending}
                    isSuccess={updateMutation.isSuccess}
                    loadingText="Saving..."
                    successText="AI Settings Saved!"
                  >
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Save AI Configuration
                    </>
                  </SaveButton>
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
