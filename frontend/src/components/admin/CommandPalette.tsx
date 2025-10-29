import { Fragment, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  TagIcon,
  DocumentTextIcon,
  BarsArrowUpIcon,
  Cog6ToothIcon,
  LanguageIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface CommandItem {
  id: string;
  name: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'actions';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [query, setQuery] = useState('');

  // Reset query when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        name: 'Dashboard',
        description: 'Go to dashboard overview',
        icon: HomeIcon,
        action: () => {
          navigate('/admin');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-products',
        name: 'Products',
        description: 'Manage your products',
        icon: CubeIcon,
        action: () => {
          navigate('/admin/products');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-orders',
        name: 'Orders',
        description: 'View and manage orders',
        icon: ShoppingBagIcon,
        action: () => {
          navigate('/admin/orders');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-promo-codes',
        name: 'Promo Codes',
        description: 'Manage discount codes',
        icon: TagIcon,
        action: () => {
          navigate('/admin/promo-codes');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-cms',
        name: 'CMS',
        description: 'Content management system',
        icon: DocumentTextIcon,
        action: () => {
          navigate('/admin/cms');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-navigation',
        name: 'Navigation',
        description: 'Manage site navigation',
        icon: BarsArrowUpIcon,
        action: () => {
          navigate('/admin/navigation');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-translations',
        name: 'Translations',
        description: 'Manage translations',
        icon: LanguageIcon,
        action: () => {
          navigate('/admin/translations');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-cms-translations',
        name: 'CMS Translations',
        description: 'Manage CMS translations',
        icon: DocumentDuplicateIcon,
        action: () => {
          navigate('/admin/cms-translations');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-admin-users',
        name: 'Admin Users',
        description: 'Manage admin users',
        icon: UsersIcon,
        action: () => {
          navigate('/admin/admin-users');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-customers',
        name: 'Customers',
        description: 'View customer list',
        icon: UserGroupIcon,
        action: () => {
          navigate('/admin/customers');
          onClose();
        },
        category: 'navigation'
      },
      {
        id: 'nav-settings',
        name: 'Settings',
        description: 'System settings',
        icon: Cog6ToothIcon,
        action: () => {
          navigate('/admin/settings');
          onClose();
        },
        category: 'navigation'
      },
      // Actions
      {
        id: 'action-add-product',
        name: 'Add Product',
        description: 'Create a new product',
        icon: PlusIcon,
        action: () => {
          navigate('/admin/products');
          onClose();
          // You can trigger modal here if needed
        },
        category: 'actions'
      },
      {
        id: 'action-logout',
        name: 'Sign Out',
        description: 'Log out of admin panel',
        icon: ArrowRightOnRectangleIcon,
        action: () => {
          logout();
          onClose();
        },
        category: 'actions'
      }
    ],
    [navigate, logout, onClose]
  );

  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (command) =>
        command.name.toLowerCase().includes(lowerQuery) ||
        command.description?.toLowerCase().includes(lowerQuery)
    );
  }, [query, commands]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: []
    };

    filteredCommands.forEach((command) => {
      groups[command.category].push(command);
    });

    return groups;
  }, [filteredCommands]);

  return (
    <Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-midnight shadow-2xl transition-all">
              <Combobox onChange={(command: CommandItem | null) => command?.action()}>
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-champagne/40"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-champagne placeholder:text-champagne/40 focus:ring-0 sm:text-sm"
                    placeholder="Search commands..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                {filteredCommands.length > 0 && (
                  <Combobox.Options
                    static
                    className="max-h-96 scroll-py-3 overflow-y-auto p-3"
                  >
                    {groupedCommands.navigation.length > 0 && (
                      <li>
                        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-champagne/60">
                          Navigation
                        </h2>
                        <ul className="space-y-1">
                          {groupedCommands.navigation.map((command) => (
                            <Combobox.Option
                              key={command.id}
                              value={command}
                              className={({ active }) =>
                                `flex cursor-pointer select-none items-center gap-3 rounded-2xl px-3 py-2 ${
                                  active ? 'bg-blush text-midnight' : 'text-champagne'
                                }`
                              }
                            >
                              {({ active }) => (
                                <>
                                  <command.icon
                                    className={`h-6 w-6 ${active ? 'text-midnight' : 'text-champagne/70'}`}
                                    aria-hidden="true"
                                  />
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${active ? 'text-midnight' : 'text-champagne'}`}>
                                      {command.name}
                                    </p>
                                    {command.description && (
                                      <p className={`text-xs ${active ? 'text-midnight/70' : 'text-champagne/60'}`}>
                                        {command.description}
                                      </p>
                                    )}
                                  </div>
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                        </ul>
                      </li>
                    )}

                    {groupedCommands.actions.length > 0 && (
                      <li className="mt-2">
                        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-champagne/60">
                          Actions
                        </h2>
                        <ul className="space-y-1">
                          {groupedCommands.actions.map((command) => (
                            <Combobox.Option
                              key={command.id}
                              value={command}
                              className={({ active }) =>
                                `flex cursor-pointer select-none items-center gap-3 rounded-2xl px-3 py-2 ${
                                  active ? 'bg-blush text-midnight' : 'text-champagne'
                                }`
                              }
                            >
                              {({ active }) => (
                                <>
                                  <command.icon
                                    className={`h-6 w-6 ${active ? 'text-midnight' : 'text-champagne/70'}`}
                                    aria-hidden="true"
                                  />
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${active ? 'text-midnight' : 'text-champagne'}`}>
                                      {command.name}
                                    </p>
                                    {command.description && (
                                      <p className={`text-xs ${active ? 'text-midnight/70' : 'text-champagne/60'}`}>
                                        {command.description}
                                      </p>
                                    )}
                                  </div>
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                        </ul>
                      </li>
                    )}
                  </Combobox.Options>
                )}

                {query !== '' && filteredCommands.length === 0 && (
                  <div className="px-6 py-14 text-center sm:px-14">
                    <p className="text-sm text-champagne/70">
                      No commands found for "{query}". Try a different search.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-3 text-xs text-champagne/50">
                  <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 font-mono">↑↓</kbd>
                  <span>to navigate</span>
                  <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 font-mono">↵</kbd>
                  <span>to select</span>
                  <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 font-mono">esc</kbd>
                  <span>to close</span>
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
