import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
  required?: boolean;
}

export default function ColorPicker({
  label,
  value,
  onChange,
  description,
  required = false
}: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const [isValid, setIsValid] = useState(true);

  // Validate hex color format
  const validateHex = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  // Sync local input with prop value
  useEffect(() => {
    setHexInput(value);
    setIsValid(validateHex(value));
  }, [value]);

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value.toUpperCase();
    setHexInput(color);
    setIsValid(true);
    onChange(color);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.trim();

    // Auto-add # if missing
    if (inputValue && !inputValue.startsWith('#')) {
      inputValue = '#' + inputValue;
    }

    setHexInput(inputValue.toUpperCase());

    // Validate and update parent only if valid
    const valid = validateHex(inputValue);
    setIsValid(valid);

    if (valid) {
      onChange(inputValue);
    }
  };

  const handleHexInputBlur = () => {
    // If invalid on blur, revert to last valid value
    if (!isValid) {
      setHexInput(value);
      setIsValid(true);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="flex items-center gap-2 text-sm font-semibold text-champagne">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>

      {/* Color Picker + Hex Input Row */}
      <div className="flex items-center gap-3">
        {/* Native Color Picker */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleNativePickerChange}
            className="h-12 w-12 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
            style={{
              appearance: 'none',
              WebkitAppearance: 'none'
            }}
          />
          {/* Preview swatch with border */}
          <div
            className="absolute inset-1 rounded-md pointer-events-none border border-white/10"
            style={{ backgroundColor: value }}
          />
        </div>

        {/* Hex Input */}
        <div className="flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            onBlur={handleHexInputBlur}
            placeholder="#8BBA9C"
            maxLength={7}
            className={`w-full px-4 py-2.5 bg-white/10 border rounded-xl text-champagne placeholder-champagne/40 font-mono text-sm uppercase focus:outline-none focus:ring-2 transition-all ${
              isValid
                ? 'border-white/20 focus:border-blush focus:ring-blush/20'
                : 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
            }`}
          />
        </div>

        {/* Color Preview Block */}
        <div className="flex flex-col items-center">
          <div
            className="h-12 w-20 rounded-lg border-2 border-white/20 shadow-inner"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs text-champagne/50 mt-1">Preview</span>
        </div>
      </div>

      {/* Description or Error */}
      {description && isValid && (
        <p className="text-xs text-champagne/60">{description}</p>
      )}
      {!isValid && (
        <p className="text-xs text-rose-400">
          Invalid hex color format. Use #RRGGBB (e.g., #8BBA9C)
        </p>
      )}
    </div>
  );
}
