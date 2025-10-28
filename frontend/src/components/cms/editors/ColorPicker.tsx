// Color Picker Component with Presets
import { useState } from 'react';

const COLOR_PRESETS = {
  'Luxury Dark': {
    primary: '#1a1d24', // midnight
    secondary: '#8bba9c', // jade
    accent: '#e8c7c8', // champagne
    text: '#ffffff'
  },
  'Light & Airy': {
    primary: '#ffffff',
    secondary: '#8bba9c',
    accent: '#f5e6d3',
    text: '#1a1d24'
  },
  'Bold & Modern': {
    primary: '#000000',
    secondary: '#ff6b6b',
    accent: '#ffd93d',
    text: '#ffffff'
  },
  'Ocean Blue': {
    primary: '#0a2540',
    secondary: '#00d4ff',
    accent: '#7c3aed',
    text: '#ffffff'
  },
  'Forest Green': {
    primary: '#1a3a1a',
    secondary: '#4ade80',
    accent: '#fbbf24',
    text: '#ffffff'
  },
  'Rose Gold': {
    primary: '#2d1b1b',
    secondary: '#ff9ecd',
    accent: '#ffd700',
    text: '#ffffff'
  }
};

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-champagne mb-2">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors w-full"
      >
        <div
          className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <span className="flex-1 text-left text-champagne font-mono text-sm">{value}</span>
        <svg className="h-4 w-4 text-champagne" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-midnight border border-white/10 rounded-lg shadow-2xl p-4 max-h-80 overflow-auto">
            {/* Custom Color Input */}
            <div className="mb-4">
              <p className="text-xs text-champagne/60 mb-2">Custom Color</p>
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm focus:outline-none focus:border-jade"
              />
            </div>

            {/* Quick Colors */}
            <div className="mb-4">
              <p className="text-xs text-champagne/60 mb-2">Quick Colors</p>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#000000', '#ffffff', '#1a1d24', '#8bba9c', '#e8c7c8',
                  '#ff6b6b', '#ffd93d', '#00d4ff', '#7c3aed', '#4ade80',
                  '#fbbf24', '#ff9ecd', '#f97316', '#06b6d4', '#a855f7', '#ec4899'
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onChange(color);
                      setIsOpen(false);
                    }}
                    className="w-8 h-8 rounded-lg border-2 border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Color Scheme Preset Picker
interface ColorSchemePickerProps {
  onSelect: (scheme: { primary: string; secondary: string; accent: string; text: string }) => void;
}

export function ColorSchemePicker({ onSelect }: ColorSchemePickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-champagne">Color Scheme Presets</label>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(COLOR_PRESETS).map(([name, colors]) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(colors)}
            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-jade/50 transition-all text-left group"
          >
            <div className="flex gap-2 mb-2">
              {Object.values(colors).map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-champagne group-hover:text-jade transition-colors">
              {name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
