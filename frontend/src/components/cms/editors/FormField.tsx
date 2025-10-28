// Shared Form Field Component with Label and Error Display
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({ label, error, helpText, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-champagne">
        {label}
        {required && <span className="ml-1 text-jade">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-champagne/50">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
