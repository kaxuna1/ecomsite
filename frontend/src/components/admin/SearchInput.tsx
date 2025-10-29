import { InputHTMLAttributes } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  onClear?: () => void;
  containerClassName?: string;
}

export default function SearchInput({
  value,
  onClear,
  containerClassName = '',
  className = '',
  ...props
}: SearchInputProps) {
  return (
    <div className={`relative ${containerClassName}`}>
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/40" />
      <input
        type="search"
        value={value}
        className={`w-full rounded-full border border-white/20 bg-midnight px-12 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20 ${className}`}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-champagne/40 hover:bg-white/10 hover:text-champagne"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
