// AnnouncementBlock Component
// Renders a promotional announcement bar for the storefront header

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  TagIcon,
  GiftIcon,
  SparklesIcon,
  XMarkIcon,
  MegaphoneIcon,
  TicketIcon,
  StarIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import type { AnnouncementContent } from '../../types/cms';

interface AnnouncementBlockProps {
  content: AnnouncementContent;
  blockId?: number;
}

// Icon mapping for announcement bar
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: TruckIcon,
  tag: TagIcon,
  gift: GiftIcon,
  sparkles: SparklesIcon,
  megaphone: MegaphoneIcon,
  ticket: TicketIcon,
  star: StarIcon,
  fire: FireIcon,
  bolt: BoltIcon,
};

export default function AnnouncementBlock({ content, blockId }: AnnouncementBlockProps) {
  const {
    message,
    linkText,
    linkUrl,
    icon = 'truck',
    backgroundColor = '#1e293b',
    textColor = '#ffffff',
    dismissible = false,
  } = content;

  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissal state (persisted by block ID)
  useEffect(() => {
    if (dismissible && blockId) {
      const dismissedKey = `announcement-dismissed-${blockId}`;
      const wasDismissed = localStorage.getItem(dismissedKey);
      if (wasDismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [dismissible, blockId]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (blockId) {
      localStorage.setItem(`announcement-dismissed-${blockId}`, 'true');
    }
  };

  const Icon = iconMap[icon] || TruckIcon;

  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ backgroundColor }}
        className="relative overflow-hidden"
      >
        <div
          className="py-2 text-center text-xs font-medium sm:text-sm"
          style={{ color: textColor }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4">
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 sm:flex-none">{message}</span>
            {linkText && linkUrl && (
              <>
                <span className="hidden sm:inline text-white/60">|</span>
                <Link
                  to={linkUrl}
                  className="hidden sm:inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline transition-all"
                  style={{ color: textColor }}
                >
                  {linkText}
                </Link>
              </>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: textColor }}
              aria-label="Dismiss announcement"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
