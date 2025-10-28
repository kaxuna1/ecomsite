// Icon Picker Component for selecting Hero Icons
import { useState } from 'react';
import {
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  StarIcon,
  BoltIcon,
  FireIcon,
  GlobeAltIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const AVAILABLE_ICONS = [
  { name: 'truck', Icon: TruckIcon, label: 'Truck' },
  { name: 'shield', Icon: ShieldCheckIcon, label: 'Shield' },
  { name: 'sparkles', Icon: SparklesIcon, label: 'Sparkles' },
  { name: 'heart', Icon: HeartIcon, label: 'Heart' },
  { name: 'chat', Icon: ChatBubbleLeftRightIcon, label: 'Chat' },
  { name: 'lock', Icon: LockClosedIcon, label: 'Lock' },
  { name: 'check', Icon: CheckBadgeIcon, label: 'Check Badge' },
  { name: 'star', Icon: StarIcon, label: 'Star' },
  { name: 'bolt', Icon: BoltIcon, label: 'Bolt' },
  { name: 'fire', Icon: FireIcon, label: 'Fire' },
  { name: 'globe', Icon: GlobeAltIcon, label: 'Globe' },
  { name: 'cube', Icon: CubeIcon, label: 'Cube' }
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === value);
  const SelectedIconComponent = selectedIcon?.Icon || SparklesIcon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne hover:bg-white/10 transition-colors w-full"
      >
        <SelectedIconComponent className="h-6 w-6 text-jade" />
        <span className="flex-1 text-left">{selectedIcon?.label || 'Select Icon'}</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-midnight border border-white/10 rounded-lg shadow-2xl max-h-80 overflow-auto">
            <div className="grid grid-cols-3 gap-2 p-3">
              {AVAILABLE_ICONS.map(({ name, Icon, label }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    value === name
                      ? 'bg-jade/20 text-jade border border-jade'
                      : 'bg-white/5 text-champagne hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-xs text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
