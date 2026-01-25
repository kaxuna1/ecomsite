import { useState, Fragment, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  TagIcon,
  DocumentTextIcon,
  Bars3Icon,
  BarsArrowUpIcon,
  Cog6ToothIcon,
  LanguageIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  UserGroupIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  SwatchIcon,
  Squares2X2Icon,
  GlobeAltIcon,
  PhotoIcon,
  EnvelopeIcon,
  StarIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import CommandPalette from './admin/CommandPalette';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: CubeIcon },
  { name: 'Attributes', href: '/admin/attributes', icon: SwatchIcon },
  { name: 'Variant Options', href: '/admin/variant-options', icon: Squares2X2Icon },
  { name: 'Media Library', href: '/admin/media', icon: PhotoIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Reviews', href: '/admin/reviews', icon: StarIcon },
  { name: 'Promo Codes', href: '/admin/promo-codes', icon: TagIcon },
  { name: 'Newsletter', href: '/admin/newsletter', icon: EnvelopeIcon },
  { name: 'CMS', href: '/admin/cms', icon: DocumentTextIcon },
  { name: 'Navigation', href: '/admin/navigation', icon: BarsArrowUpIcon },
  { name: 'Languages', href: '/admin/languages', icon: GlobeAltIcon },
  { name: 'Translations', href: '/admin/translations', icon: LanguageIcon },
  { name: 'CMS Translations', href: '/admin/cms-translations', icon: DocumentDuplicateIcon },
  { name: 'Static Translations', href: '/admin/static-translations', icon: CommandLineIcon },
  { name: 'Admin Users', href: '/admin/admin-users', icon: UsersIcon },
  { name: 'Customers', href: '/admin/customers', icon: UserGroupIcon },
  { name: 'Themes', href: '/admin/themes', icon: PaintBrushIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon }
];

function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const currentPage = navigation.find(item => {
    if (item.href === '/admin') {
      return location.pathname === '/admin';
    }
    // Exact match or match with trailing slash or path separator
    return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  });

  // Command Palette keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:text-text-primary focus:shadow-lg"
      >
        Skip to content
      </a>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel id="admin-mobile-sidebar" className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-text-primary" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border-default bg-bg-elevated px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <span className="font-display text-xl uppercase tracking-[0.3em] text-text-primary">
                      Luxia Admin
                    </span>
                  </div>
                  <nav className="flex flex-1 flex-col" aria-label="Admin navigation">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => {
                            const isActive = item.href === '/admin'
                              ? location.pathname === '/admin'
                              : location.pathname === item.href || location.pathname.startsWith(item.href + '/');

                            return (
                              <li key={item.name}>
                                <NavLink
                                  to={item.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`group flex gap-x-3 rounded-2xl p-3 text-sm font-semibold leading-6 transition-colors ${
                                    isActive
                                      ? 'bg-interactive-default text-on-interactive'
                                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                                  }`}
                                >
                                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                  {item.name}
                                  {item.badge !== undefined && (
                                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                                      {item.badge}
                                    </span>
                                  )}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                      <li className="mt-auto">
                        <button
                          type="button"
                          onClick={logout}
                          className="group -mx-2 flex w-full gap-x-3 rounded-2xl p-3 text-sm font-semibold leading-6 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-error"
                        >
                          <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          Sign Out
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border-default bg-bg-elevated/80 backdrop-blur px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-display text-xl uppercase tracking-[0.3em] text-text-primary"
              >
                Luxia
              </motion.span>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="rounded-full p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav className="flex flex-1 flex-col" aria-label="Admin navigation">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = item.href === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname === item.href || location.pathname.startsWith(item.href + '/');

                    return (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          className={`group flex gap-x-3 rounded-2xl p-3 text-sm font-semibold leading-6 transition-all ${
                            isActive
                              ? 'bg-interactive-default text-on-interactive shadow-lg shadow-primary/20'
                              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                          } ${sidebarCollapsed ? 'justify-center' : ''}`}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          {!sidebarCollapsed && (
                            <>
                              <span className="truncate">{item.name}</span>
                              {item.badge !== undefined && (
                                <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                          {sidebarCollapsed && item.badge !== undefined && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  type="button"
                  onClick={logout}
                  className={`group -mx-2 flex w-full gap-x-3 rounded-2xl p-3 text-sm font-semibold leading-6 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-error ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? 'Sign Out' : undefined}
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span>Sign Out</span>}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border-default bg-bg-elevated/80 px-4 backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-text-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            aria-controls="admin-mobile-sidebar"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-border-default lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-3">
              {currentPage && (
                <>
                  <currentPage.icon className="h-6 w-6 text-primary" />
                  <h1 className="font-display text-lg uppercase tracking-wider text-text-primary">
                    {currentPage.name}
                  </h1>
                </>
              )}
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Command Palette Trigger */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Open command palette"
                aria-keyshortcuts="Ctrl+K"
                className="flex items-center gap-2 rounded-full border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden rounded border border-border-default bg-bg-primary px-2 py-0.5 text-xs font-mono sm:inline">
                  {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}K
                </kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main id="admin-main" tabIndex={-1} className="px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default AdminLayout;
