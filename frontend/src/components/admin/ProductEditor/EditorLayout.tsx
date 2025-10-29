import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckCircleIcon, CloudIcon } from '@heroicons/react/24/outline';

type TabType = 'details' | 'variants';

interface Tab {
  id: TabType;
  label: string;
  icon?: ReactNode;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
}

interface EditorLayoutProps {
  title: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isDirty: boolean;
  autoSaveStatus?: AutoSaveStatus;
  children: ReactNode;
}

const tabs: Tab[] = [
  { id: 'details', label: 'Product Details' },
  { id: 'variants', label: 'Variants & SKUs' },
];

export default function EditorLayout({
  title,
  activeTab,
  onTabChange,
  onSave,
  onCancel,
  isSaving,
  isDirty,
  autoSaveStatus,
  children
}: EditorLayoutProps) {
  return (
    <div className="min-h-screen bg-midnight">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-midnight/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Title Bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Back</span>
              </button>
              <div>
                <h1 className="font-display text-2xl text-champagne">{title}</h1>
                <div className="flex items-center gap-3 text-xs">
                  {isDirty && (
                    <p className="text-champagne/60">
                      Unsaved changes
                    </p>
                  )}
                  {autoSaveStatus && (
                    <div className="flex items-center gap-1.5">
                      {autoSaveStatus.isSaving ? (
                        <>
                          <CloudIcon className="h-3.5 w-3.5 animate-pulse text-blush/60" />
                          <span className="text-blush/60">Saving draft...</span>
                        </>
                      ) : autoSaveStatus.lastSaved ? (
                        <>
                          <CloudIcon className="h-3.5 w-3.5 text-emerald-400/60" />
                          <span className="text-emerald-400/60">
                            Draft saved {new Date(autoSaveStatus.lastSaved).toLocaleTimeString()}
                          </span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-champagne transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-semibold text-midnight transition-colors hover:bg-champagne disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative px-6 py-3 text-sm font-semibold transition-colors"
              >
                <span
                  className={
                    activeTab === tab.id
                      ? 'text-blush'
                      : 'text-champagne/60 hover:text-champagne'
                  }
                >
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blush"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
