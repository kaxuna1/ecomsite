import { InputHTMLAttributes, useId } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  onClear?: () => void;
  containerClassName?: string;
  label?: string;
  helperText?: string;
  resultsCount?: number;
  resultsLabel?: string;
}

export default function SearchInput({
  value,
  onClear,
  containerClassName = '',
  label = 'Search',
  helperText,
  resultsCount,
  resultsLabel,
  className = '',
  id,
  ...props
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText || resultsCount !== undefined ? `${inputId}-helper` : undefined;
  const computedHelperText =
    helperText ??
    (resultsCount !== undefined ? `${resultsCount} ${resultsLabel ?? 'results'}` : undefined);

  return (
    <div className={`relative ${containerClassName}`}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
      <input
        type="search"
        value={value}
        id={inputId}
        aria-label={label}
        aria-describedby={helperId}
        autoComplete="off"
        spellCheck={false}
        className={`w-full rounded-full border border-border-default bg-bg-elevated px-12 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${className}`}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
      {computedHelperText && (
        <p
          id={helperId}
          className="mt-2 text-xs text-text-tertiary"
          aria-live="polite"
        >
          {computedHelperText}
        </p>
      )}
    </div>
  );
}
