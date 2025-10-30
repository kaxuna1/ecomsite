/**
 * AI Model Configuration Data
 * Latest 2025 models with pricing and specifications
 */

export interface AIModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    input: number; // USD per 1M tokens
    output: number; // USD per 1M tokens
  };
  contextWindow: string;
  badge?: 'Recommended' | 'Cheapest' | 'Fastest' | 'Legacy';
  speed: 'Fastest' | 'Fast' | 'Medium';
}

export const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Multimodal (text, images, audio)',
    pricing: { input: 2.50, output: 10.00 },
    contextWindow: '128K',
    badge: 'Recommended',
    speed: 'Fast'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    description: 'Fast & cost-effective',
    pricing: { input: 0.15, output: 0.60 },
    contextWindow: '128K',
    badge: 'Cheapest',
    speed: 'Fastest'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Previous generation, still powerful',
    pricing: { input: 10.00, output: 30.00 },
    contextWindow: '128K',
    speed: 'Fast'
  },
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo Preview',
    description: 'Preview version',
    pricing: { input: 10.00, output: 30.00 },
    contextWindow: '128K',
    speed: 'Fast'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Being phased out',
    pricing: { input: 0.50, output: 1.50 },
    contextWindow: '16K',
    badge: 'Legacy',
    speed: 'Fastest'
  }
];

export const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Fastest model for daily tasks',
    pricing: { input: 1.00, output: 5.00 },
    contextWindow: '200K',
    badge: 'Recommended',
    speed: 'Fastest'
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Smart, efficient model for everyday use',
    pricing: { input: 3.00, output: 15.00 },
    contextWindow: '200K',
    speed: 'Fast'
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    description: 'Powerful, large model for complex challenges',
    pricing: { input: 15.00, output: 75.00 },
    contextWindow: '200K',
    speed: 'Medium'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and cost-effective',
    pricing: { input: 0.80, output: 4.00 },
    contextWindow: '200K',
    badge: 'Cheapest',
    speed: 'Fastest'
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Enhanced reasoning capabilities',
    pricing: { input: 3.00, output: 15.00 },
    contextWindow: '200K',
    speed: 'Fast'
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Previous generation sonnet',
    pricing: { input: 3.00, output: 15.00 },
    contextWindow: '200K',
    speed: 'Fast'
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Previous generation opus',
    pricing: { input: 15.00, output: 75.00 },
    contextWindow: '200K',
    speed: 'Medium'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Legacy fast model',
    pricing: { input: 0.25, output: 1.25 },
    contextWindow: '200K',
    badge: 'Legacy',
    speed: 'Fastest'
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Legacy powerful model',
    pricing: { input: 15.00, output: 75.00 },
    contextWindow: '200K',
    badge: 'Legacy',
    speed: 'Medium'
  }
];

/**
 * Get badge color classes for styling
 */
export function getBadgeColor(badge?: string): string {
  switch (badge) {
    case 'Recommended':
      return 'bg-blush/20 text-blush border-blush/30';
    case 'Cheapest':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Fastest':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Legacy':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-white/10 text-champagne/60 border-white/20';
  }
}

/**
 * Get speed icon/indicator
 */
export function getSpeedIndicator(speed: string): string {
  switch (speed) {
    case 'Fastest':
      return '⚡⚡⚡';
    case 'Fast':
      return '⚡⚡';
    case 'Medium':
      return '⚡';
    default:
      return '';
  }
}
