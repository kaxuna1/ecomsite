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
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
