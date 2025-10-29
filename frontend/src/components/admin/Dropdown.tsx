import { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-10 mt-2 w-56 origin-top-${align} rounded-2xl border border-white/10 bg-midnight shadow-xl backdrop-blur-sm`}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Menu.Item key={index} disabled={item.disabled}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.danger
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-champagne hover:bg-white/10'
                    } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''} ${
                      active ? 'bg-white/5' : ''
                    }`}
                  >
                    {item.icon && <span className="h-5 w-5">{item.icon}</span>}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
