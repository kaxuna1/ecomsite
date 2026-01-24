import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckCircleIcon, CloudIcon } from '@heroicons/react/24/outline';

type TabType = 'details' | 'media' | 'variants' | 'translations';

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
  { id: 'media', label: 'Media Gallery' },
  { id: 'variants', label: 'Variants & SKUs' },
  { id: 'translations', label: 'Translations' },
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
    <div className="min-h-screen bg-bg-primary">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-border-default bg-bg-primary/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Title Bar */}
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Back</span>
              </button>
              <div>
                <h1 className="font-display text-2xl text-text-primary">{title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {isDirty && (
                    <p className="text-text-secondary">
                      Unsaved changes
                    </p>
                  )}
                  {autoSaveStatus && (
                    <div className="flex items-center gap-1.5">
                      {autoSaveStatus.isSaving ? (
                        <>
                          <CloudIcon className="h-3.5 w-3.5 animate-pulse text-primary/60" />
                          <span className="text-primary/60">Saving draft...</span>
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={onCancel}
                className="w-full rounded-full border border-border-default px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-interactive-default px-6 py-3 text-sm font-semibold text-on-interactive transition-colors hover:bg-interactive-hover disabled:opacity-50 sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-interactive border-t-transparent" />
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
          <div className="-mx-4 flex gap-1 overflow-x-auto pb-2 px-4 sm:mx-0 sm:pb-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative whitespace-nowrap px-4 py-3 text-xs font-semibold transition-colors sm:px-6 sm:text-sm"
              >
                <span
                  className={
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }
                >
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
