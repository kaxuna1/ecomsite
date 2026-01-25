import {
  SparklesIcon,
  PhotoIcon,
  ShoppingBagIcon,
  ChatBubbleBottomCenterTextIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  BellAlertIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface BlockSummaryProps {
  blockType: string;
  content: Record<string, unknown>;
}

// Get the appropriate icon for each block type
function getBlockIcon(blockType: string) {
  const iconClass = "h-5 w-5";
  switch (blockType) {
    case 'hero':
      return <SparklesIcon className={iconClass} />;
    case 'features':
      return <SparklesIcon className={iconClass} />;
    case 'products':
      return <ShoppingBagIcon className={iconClass} />;
    case 'testimonials':
      return <ChatBubbleBottomCenterTextIcon className={iconClass} />;
    case 'newsletter':
      return <EnvelopeIcon className={iconClass} />;
    case 'text_image':
      return <PhotoIcon className={iconClass} />;
    case 'stats':
      return <ChartBarIcon className={iconClass} />;
    case 'cta':
      return <MegaphoneIcon className={iconClass} />;
    case 'faq':
      return <QuestionMarkCircleIcon className={iconClass} />;
    case 'announcement':
      return <BellAlertIcon className={iconClass} />;
    default:
      return <DocumentTextIcon className={iconClass} />;
  }
}

// Truncate text to a maximum length
function truncate(text: string | undefined | null, maxLength: number = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Extract text content safely
function getText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

// Summary row component
function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-text-tertiary font-medium min-w-[80px] flex-shrink-0">{label}:</span>
      <span className="text-text-secondary flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}

// Hero block summary
function HeroSummary({ content }: { content: Record<string, unknown> }) {
  const headline = getText(content.headline);
  const subheadline = getText(content.subheadline);
  const ctaText = getText(content.ctaText);
  const ctaLink = getText(content.ctaLink);
  const template = getText(content.template);
  const hasImage = Boolean(content.imageUrl || content.backgroundImage);

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Headline" value={truncate(headline, 60)} />
      <SummaryRow label="Subheadline" value={truncate(subheadline, 80)} />
      {ctaText && (
        <SummaryRow 
          label="CTA" 
          value={`"${ctaText}" → ${ctaLink || 'No link'}`}
          icon={<LinkIcon className="h-3.5 w-3.5 text-primary" />}
        />
      )}
      <div className="flex gap-4 mt-2">
        {template && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
            Template: {template}
          </span>
        )}
        {hasImage && (
          <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded flex items-center gap-1">
            <PhotoIcon className="h-3 w-3" /> Has image
          </span>
        )}
      </div>
    </div>
  );
}

// Features block summary
function FeaturesSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const subtitle = getText(content.subtitle);
  const features = Array.isArray(content.features) ? content.features : [];

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      <SummaryRow label="Subtitle" value={truncate(subtitle, 80)} />
      {features.length > 0 && (
        <div className="mt-2">
          <span className="text-text-tertiary text-sm font-medium">Features ({features.length}):</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {features.slice(0, 4).map((f: Record<string, unknown>, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-bg-secondary text-text-secondary text-xs rounded">
                {truncate(getText(f.title), 25) || `Feature ${i + 1}`}
              </span>
            ))}
            {features.length > 4 && (
              <span className="px-2 py-0.5 bg-bg-secondary text-text-tertiary text-xs rounded">
                +{features.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Products block summary
function ProductsSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const subtitle = getText(content.subtitle);
  const displayMode = getText(content.displayMode);
  const limit = content.limit;

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      <SummaryRow label="Subtitle" value={truncate(subtitle, 80)} />
      <div className="flex gap-2 mt-2">
        {displayMode && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
            Mode: {displayMode}
          </span>
        )}
        {limit && (
          <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded">
            Limit: {String(limit)} products
          </span>
        )}
      </div>
    </div>
  );
}

// Testimonials block summary
function TestimonialsSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const testimonials = Array.isArray(content.testimonials) ? content.testimonials : [];

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      {testimonials.length > 0 && (
        <div className="mt-2">
          <span className="text-text-tertiary text-sm font-medium">Testimonials ({testimonials.length}):</span>
          <div className="space-y-1 mt-1">
            {testimonials.slice(0, 2).map((t: Record<string, unknown>, i: number) => (
              <div key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-primary/30">
                "{truncate(getText(t.quote), 60)}" — {getText(t.author) || 'Anonymous'}
              </div>
            ))}
            {testimonials.length > 2 && (
              <span className="text-xs text-text-tertiary pl-2">
                +{testimonials.length - 2} more testimonials
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Newsletter block summary
function NewsletterSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const description = getText(content.description);
  const buttonText = getText(content.buttonText);

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      <SummaryRow label="Description" value={truncate(description, 80)} />
      {buttonText && (
        <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded mt-1">
          Button: "{buttonText}"
        </span>
      )}
    </div>
  );
}

// Text + Image block summary
function TextImageSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const text = getText(content.text) || getText(content.description);
  const imagePosition = getText(content.imagePosition);
  const hasImage = Boolean(content.imageUrl);
  const ctaText = getText(content.ctaText);

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      <SummaryRow label="Text" value={truncate(text, 100)} />
      <div className="flex gap-2 mt-2">
        {imagePosition && (
          <span className="px-2 py-0.5 bg-bg-secondary text-text-secondary text-xs rounded">
            Image: {imagePosition}
          </span>
        )}
        {hasImage && (
          <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded flex items-center gap-1">
            <PhotoIcon className="h-3 w-3" /> Has image
          </span>
        )}
        {ctaText && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
            CTA: "{ctaText}"
          </span>
        )}
      </div>
    </div>
  );
}

// Stats block summary
function StatsSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const stats = Array.isArray(content.stats) ? content.stats : [];

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {stats.slice(0, 4).map((s: Record<string, unknown>, i: number) => (
            <div key={i} className="px-3 py-1 bg-bg-secondary rounded text-center">
              <div className="text-lg font-bold text-primary">{getText(s.value)}</div>
              <div className="text-xs text-text-tertiary">{truncate(getText(s.label), 20)}</div>
            </div>
          ))}
          {stats.length > 4 && (
            <div className="px-3 py-1 bg-bg-secondary rounded flex items-center">
              <span className="text-xs text-text-tertiary">+{stats.length - 4} more</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CTA block summary
function CTASummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const description = getText(content.description);
  const buttonText = getText(content.buttonText);
  const buttonLink = getText(content.buttonLink);

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      <SummaryRow label="Description" value={truncate(description, 80)} />
      {buttonText && (
        <SummaryRow 
          label="Button" 
          value={`"${buttonText}" → ${buttonLink || 'No link'}`}
          icon={<LinkIcon className="h-3.5 w-3.5 text-primary" />}
        />
      )}
    </div>
  );
}

// FAQ block summary
function FAQSummary({ content }: { content: Record<string, unknown> }) {
  const title = getText(content.title);
  const faqs = Array.isArray(content.faqs) ? content.faqs : (Array.isArray(content.items) ? content.items : []);

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Title" value={truncate(title, 60)} />
      {faqs.length > 0 && (
        <div className="mt-2">
          <span className="text-text-tertiary text-sm font-medium">Questions ({faqs.length}):</span>
          <div className="space-y-1 mt-1">
            {faqs.slice(0, 3).map((f: Record<string, unknown>, i: number) => (
              <div key={i} className="text-xs text-text-secondary flex items-start gap-1">
                <span className="text-primary font-bold">Q:</span>
                {truncate(getText(f.question), 70)}
              </div>
            ))}
            {faqs.length > 3 && (
              <span className="text-xs text-text-tertiary">
                +{faqs.length - 3} more questions
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Announcement block summary
function AnnouncementSummary({ content }: { content: Record<string, unknown> }) {
  const text = getText(content.text);
  const linkText = getText(content.linkText);
  const linkUrl = getText(content.linkUrl);
  const isEnabled = content.isEnabled !== false;

  return (
    <div className="space-y-1.5">
      <SummaryRow label="Message" value={truncate(text, 80)} />
      {linkText && (
        <SummaryRow 
          label="Link" 
          value={`"${linkText}" → ${linkUrl || 'No URL'}`}
          icon={<LinkIcon className="h-3.5 w-3.5 text-primary" />}
        />
      )}
      <div className="mt-2">
        <span className={`px-2 py-0.5 text-xs rounded ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  );
}

// Default/fallback summary
function DefaultSummary({ content }: { content: Record<string, unknown> }) {
  const keys = Object.keys(content).slice(0, 5);
  
  return (
    <div className="space-y-1">
      {keys.map((key) => {
        const value = content[key];
        let displayValue = '';
        
        if (typeof value === 'string') {
          displayValue = truncate(value, 60);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          displayValue = String(value);
        } else if (Array.isArray(value)) {
          displayValue = `[${value.length} items]`;
        } else if (typeof value === 'object' && value !== null) {
          displayValue = '{...}';
        }
        
        return displayValue ? (
          <SummaryRow key={key} label={key} value={displayValue} />
        ) : null;
      })}
      {Object.keys(content).length > 5 && (
        <span className="text-xs text-text-tertiary">
          +{Object.keys(content).length - 5} more fields
        </span>
      )}
    </div>
  );
}

export default function BlockSummary({ blockType, content }: BlockSummaryProps) {
  const safeContent = (content && typeof content === 'object') ? content as Record<string, unknown> : {};
  
  return (
    <div className="p-4 bg-bg-secondary/50 rounded-lg border border-border-default">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-default">
        <div className="p-1.5 bg-primary/10 rounded text-primary">
          {getBlockIcon(blockType)}
        </div>
        <span className="text-sm font-medium text-text-primary capitalize">
          {blockType.replace('_', ' ')} Content
        </span>
      </div>
      
      {(() => {
        switch (blockType) {
          case 'hero':
            return <HeroSummary content={safeContent} />;
          case 'features':
            return <FeaturesSummary content={safeContent} />;
          case 'products':
            return <ProductsSummary content={safeContent} />;
          case 'testimonials':
            return <TestimonialsSummary content={safeContent} />;
          case 'newsletter':
            return <NewsletterSummary content={safeContent} />;
          case 'text_image':
            return <TextImageSummary content={safeContent} />;
          case 'stats':
            return <StatsSummary content={safeContent} />;
          case 'cta':
            return <CTASummary content={safeContent} />;
          case 'faq':
            return <FAQSummary content={safeContent} />;
          case 'announcement':
            return <AnnouncementSummary content={safeContent} />;
          default:
            return <DefaultSummary content={safeContent} />;
        }
      })()}
    </div>
  );
}
