// Unified Save Button Component with Loading and Success States
// Based on best practices from Stripe, Linear, and modern SaaS applications
import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export type SaveButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';
export type SaveButtonSize = 'sm' | 'md' | 'lg';

interface SaveButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit';
  isLoading?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  variant?: SaveButtonVariant;
  size?: SaveButtonSize;
  fullWidth?: boolean;
  children?: React.ReactNode;
  loadingText?: string;
  successText?: string;
  successDuration?: number; // How long to show success state (ms)
  className?: string;
}

export default function SaveButton({
  onClick,
  type = 'button',
  isLoading = false,
  isSuccess = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children = 'Save',
  loadingText = 'Saving...',
  successText = 'Saved!',
  successDuration = 2000,
  className = ''
}: SaveButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-hide success state after duration
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, successDuration]);

  // Determine button state
  const isSuccessState = showSuccess && !isLoading;
  const isDisabled = disabled || isLoading || isSuccessState;

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-blush text-midnight hover:bg-champagne',
    secondary: 'bg-white/10 text-champagne border border-white/20 hover:bg-white/20',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  // Success state classes
  const successClasses = 'bg-green-600 text-white';

  // Base classes
  const baseClasses = [
    'relative rounded-full font-semibold transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus:ring-2 focus:ring-blush focus:ring-offset-2 focus:ring-offset-midnight',
    'flex items-center justify-center gap-2',
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    isSuccessState ? successClasses : variantClasses[variant],
    className
  ].join(' ');

  // Spinner component
  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Success checkmark with animation
  const SuccessIcon = () => (
    <div className="flex items-center justify-center">
      <CheckIcon className="h-5 w-5 animate-scale-in" />
    </div>
  );

  // Button content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <Spinner />
          <span>{loadingText}</span>
        </>
      );
    }

    if (isSuccessState) {
      return (
        <>
          <SuccessIcon />
          <span>{successText}</span>
        </>
      );
    }

    return children;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={baseClasses}
    >
      {renderContent()}

      {/* Add custom animations via style tag */}
      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </button>
  );
}

// Usage Examples:
/*
// Basic usage
<SaveButton
  type="submit"
  isLoading={mutation.isPending}
  isSuccess={mutation.isSuccess}
>
  Save Changes
</SaveButton>

// With custom text
<SaveButton
  onClick={handleSave}
  isLoading={isSaving}
  isSuccess={savedSuccessfully}
  loadingText="Publishing..."
  successText="Published!"
>
  Publish Page
</SaveButton>

// Secondary variant
<SaveButton
  variant="secondary"
  onClick={handleDraft}
>
  Save as Draft
</SaveButton>

// Full width
<SaveButton
  fullWidth
  type="submit"
  isLoading={mutation.isPending}
>
  Save Settings
</SaveButton>

// Small size
<SaveButton
  size="sm"
  onClick={handleQuickSave}
>
  Quick Save
</SaveButton>
*/
