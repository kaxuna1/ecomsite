import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  Bars3Icon,
  XMarkIcon,
  TruckIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { getFavorites } from '../api/favorites';
import { fetchMenu } from '../api/navigation';
import { fetchPublicSettings } from '../api/settings';
import type { MenuItemHierarchical } from '../types/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import SearchModal from './SearchModal';

function Navbar() {
  const { items, total, removeItem } = useCart();
  const { user, isAuthenticated, userLogout } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { t, i18n } = useTranslation('common');
  const localizedPath = useLocalizedPath();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // CMD+K / CTRL+K keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch favorites count
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  const favoritesCount = favorites?.length || 0;

  // Fetch dynamic menu from backend
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['navigation-menu', 'header', i18n.language],
    queryFn: () => fetchMenu('header', i18n.language),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch logo settings from backend
  const { data: logoSettings } = useQuery({
    queryKey: ['public-site-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Fallback navigation items if menu fetch fails
  const fallbackNavigation: MenuItemHierarchical[] = [
    { id: 0, label: t('nav.home'), linkType: 'internal', linkUrl: '/', cmsPageId: null, openInNewTab: false, children: [] },
    { id: 1, label: t('nav.products'), linkType: 'internal', linkUrl: '/products', cmsPageId: null, openInNewTab: false, children: [] },
    { id: 2, label: t('nav.newArrivals'), linkType: 'internal', linkUrl: '/new-arrivals', cmsPageId: null, openInNewTab: false, children: [] },
    { id: 3, label: t('nav.bestSellers'), linkType: 'internal', linkUrl: '/best-sellers', cmsPageId: null, openInNewTab: false, children: [] },
    { id: 4, label: t('nav.sale'), linkType: 'internal', linkUrl: '/sale', cmsPageId: null, openInNewTab: false, children: [] }
  ];

  // Use menu data or fallback
  const navigation: MenuItemHierarchical[] = menuData?.items || fallbackNavigation;

  const userMenuItems = [
    { nameKey: 'account.profile', href: localizedPath('/account/profile'), icon: UserCircleIcon },
    { nameKey: 'account.orders', href: localizedPath('/account/orders'), icon: ShoppingBagIcon },
    { nameKey: 'account.favorites', href: localizedPath('/account/favorites'), icon: HeartIcon }
  ];

  // Helper function to get menu item link
  const getMenuItemLink = (item: MenuItemHierarchical) => {
    if (item.linkType === 'cms_page' && item.cmsPageSlug) {
      return localizedPath(`/${item.cmsPageSlug}`);
    }
    if (item.linkType === 'internal' && item.linkUrl) {
      return localizedPath(item.linkUrl);
    }
    if (item.linkType === 'external' && item.linkUrl) {
      return item.linkUrl;
    }
    return '#';
  };

  // Helper function to handle menu item click
  const handleMenuItemClick = (item: MenuItemHierarchical, e?: React.MouseEvent) => {
    if (item.linkType === 'none') {
      e?.preventDefault();
      return;
    }
    if (item.linkType === 'external' && item.openInNewTab) {
      return; // Let the default behavior handle it
    }
  };

  // Render menu item (desktop)
  const renderMenuItem = (item: MenuItemHierarchical, index: number) => {
    const hasChildren = item.children && item.children.length > 0;
    const link = getMenuItemLink(item);
    const isExternal = item.linkType === 'external';
    const openInNewTab = item.openInNewTab;

    if (hasChildren) {
      return (
        <div
          key={index}
          className="relative"
          onMouseEnter={() => setActiveDropdown(index)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <button
            className="relative flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-midnight/70 transition-colors hover:text-jade"
          >
            {item.label}
            <ChevronDownIcon className="h-3 w-3" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {activeDropdown === index && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-champagne/40 bg-white p-2 shadow-2xl"
              >
                {item.children.map((child, childIndex) => {
                  const childLink = getMenuItemLink(child);
                  const childIsExternal = child.linkType === 'external';
                  const childOpenInNewTab = child.openInNewTab;

                  if (childIsExternal) {
                    return (
                      <a
                        key={childIndex}
                        href={childLink}
                        target={childOpenInNewTab ? '_blank' : undefined}
                        rel={childOpenInNewTab ? 'noopener noreferrer' : undefined}
                        className="block rounded-xl px-4 py-2.5 text-sm font-medium text-midnight/70 transition-colors hover:bg-champagne/30 hover:text-midnight"
                      >
                        {child.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={childIndex}
                      to={childLink}
                      onClick={(e) => handleMenuItemClick(child, e)}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-midnight/70 transition-colors hover:bg-champagne/30 hover:text-midnight"
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (isExternal) {
      return (
        <a
          key={index}
          href={link}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          className="relative text-sm font-semibold uppercase tracking-wider text-midnight/70 transition-colors hover:text-jade"
        >
          {item.label}
        </a>
      );
    }

    return (
      <NavLink
        key={index}
        to={link}
        end={link === localizedPath('/')}
        onClick={(e) => handleMenuItemClick(item, e)}
        className={({ isActive }) =>
          `relative text-sm font-semibold uppercase tracking-wider transition-colors ${
            isActive ? 'text-jade' : 'text-midnight/70 hover:text-jade'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {item.label}
            {isActive && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute -bottom-[28px] left-0 right-0 h-0.5 bg-jade"
                initial={false}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-midnight py-2 text-center text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4">
          <TruckIcon className="h-4 w-4" />
          <span>{t('header.announcement')}</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-champagne/20 bg-white/95 backdrop-blur-xl shadow-sm">
        <nav className="mx-auto max-w-7xl px-4" aria-label="Main">
          <div className="flex h-20 items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden -ml-2 p-2 text-midnight hover:text-jade transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link to={localizedPath('/')} className="group flex items-center">
              {logoSettings?.logoType === 'image' && logoSettings.logoImageUrl ? (
                <motion.img
                  src={`http://localhost:4000${logoSettings.logoImageUrl}`}
                  alt={logoSettings.logoText || 'Logo'}
                  className="h-8 lg:h-10 object-contain transition-opacity group-hover:opacity-80"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                />
              ) : (
                <motion.span
                  className="text-2xl font-display uppercase tracking-[0.3em] text-midnight transition-colors group-hover:text-jade lg:text-3xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {logoSettings?.logoText || t('brand')}
                </motion.span>
              )}
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {menuLoading ? (
                <div className="h-5 w-96 animate-pulse rounded bg-champagne/20" />
              ) : (
                navigation.map((item, index) => renderMenuItem(item, index))
              )}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Search Button */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="group relative flex items-center gap-2 p-2 text-midnight/70 transition-colors hover:text-jade"
                aria-label="Search"
                title="Search (Cmd+K)"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span className="hidden lg:flex items-center gap-1 text-xs text-midnight/40">
                  <kbd className="px-1.5 py-0.5 bg-champagne/30 rounded text-[10px] font-mono">⌘K</kbd>
                </span>
              </button>

              {/* Account/User Menu */}
              {isAuthenticated && user ? (
                <div
                  className="relative hidden sm:block"
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    className="group relative flex items-center gap-2 p-2 text-midnight/70 transition-colors hover:text-jade"
                    aria-label="Account"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jade/10 text-jade font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-champagne/40 bg-white p-2 shadow-2xl"
                      >
                        <div className="border-b border-champagne/40 px-4 py-3 mb-2">
                          <p className="font-semibold text-midnight">{user?.name || 'User'}</p>
                          <p className="text-xs text-midnight/60 truncate">{user?.email || ''}</p>
                        </div>

                        {userMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.nameKey}
                              to={item.href}
                              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-midnight/70 transition-colors hover:bg-champagne/30 hover:text-midnight"
                            >
                              <Icon className="h-5 w-5" />
                              {t(item.nameKey)}
                            </Link>
                          );
                        })}

                        <div className="my-2 border-t border-champagne/40" />

                        <button
                          onClick={() => {
                            userLogout();
                            setUserMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          {t('nav.logout')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to={localizedPath('/login')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-midnight/70 transition-colors hover:text-jade"
                  aria-label="Login"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden lg:inline">{t('nav.login')}</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to={localizedPath('/account/favorites')}
                className="group relative hidden p-2 text-midnight/70 transition-colors hover:text-jade sm:block"
                aria-label="Wishlist"
              >
                {favoritesCount > 0 ? (
                  <div className="relative">
                    <HeartSolidIcon className="h-6 w-6 text-rose-500" />
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white"
                    >
                      {favoritesCount}
                    </motion.span>
                  </div>
                ) : (
                  <HeartIcon className="h-6 w-6" />
                )}
              </Link>

              {/* Cart with Preview */}
              <div
                className="relative"
                onMouseEnter={() => setCartPreviewOpen(true)}
                onMouseLeave={() => setCartPreviewOpen(false)}
              >
                <Link
                  to={localizedPath('/cart')}
                  className="group relative flex items-center gap-2 p-2 text-midnight/70 transition-colors hover:text-jade"
                  aria-label={`Cart (${itemCount} items)`}
                >
                  <div className="relative">
                    <ShoppingBagIcon className="h-6 w-6" />
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center"
                        >
                          {/* Pulse Ring */}
                          <motion.div
                            className="absolute inset-0 rounded-full bg-jade"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.7, 0, 0.7]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          />
                          {/* Badge */}
                          <motion.span
                            className="relative flex h-full w-full items-center justify-center rounded-full bg-jade text-[10px] font-bold text-white"
                            key={itemCount}
                            initial={{ scale: 1.5, rotate: 180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          >
                            {itemCount}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="hidden text-sm font-medium lg:inline">{t('nav.cart')}</span>
                </Link>

                {/* Cart Preview Dropdown */}
                <AnimatePresence>
                  {cartPreviewOpen && itemCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-champagne/40 bg-white p-4 shadow-2xl"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-champagne/40 pb-3">
                        <h3 className="font-display text-lg text-midnight">{t('cart.yourCart')}</h3>
                        <span className="text-sm text-midnight/60">{itemCount} {t('cart.items')}</span>
                      </div>

                      <div className="max-h-64 space-y-3 overflow-y-auto">
                        {items.slice(0, 3).map(({ product, quantity }) => (
                          <div key={product.id} className="flex gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-midnight line-clamp-1">{product.name}</h4>
                              <p className="mt-1 text-xs text-midnight/60">
                                {t('cart.qty')} {quantity} × ${product.price.toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                removeItem(product.id);
                              }}
                              className="text-midnight/40 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <p className="text-center text-xs text-midnight/60">
                            +{items.length - 3} {t('cart.moreItems')}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 space-y-3 border-t border-champagne/40 pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-midnight">{t('cart.subtotal')}</span>
                          <span className="font-bold text-jade">${total.toFixed(2)}</span>
                        </div>
                        <Link
                          to={localizedPath('/cart')}
                          className="block w-full rounded-full bg-jade py-3 text-center text-sm font-semibold text-white transition-all hover:bg-jade/90 hover:shadow-lg"
                        >
                          {t('cart.viewCart')}
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-sm lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-full overflow-y-auto bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-champagne/40 p-6">
                <span className="font-display text-2xl uppercase tracking-[0.3em] text-midnight">
                  {t('brand')}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mr-2 p-2 text-midnight/70 hover:text-midnight"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* User Info (if logged in) */}
              {isAuthenticated && user && (
                <div className="border-b border-champagne/40 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-jade/10 text-jade font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-midnight">{user?.name || 'User'}</p>
                      <p className="text-xs text-midnight/60 truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1 p-6">
                {navigation.map((item, index) => {
                  const link = getMenuItemLink(item);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExternal = item.linkType === 'external';
                  const openInNewTab = item.openInNewTab;

                  if (hasChildren) {
                    return (
                      <div key={index} className="space-y-1">
                        <div className="rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wider text-midnight/70">
                          {item.label}
                        </div>
                        {item.children.map((child, childIndex) => {
                          const childLink = getMenuItemLink(child);
                          const childIsExternal = child.linkType === 'external';
                          const childOpenInNewTab = child.openInNewTab;

                          if (childIsExternal) {
                            return (
                              <a
                                key={childIndex}
                                href={childLink}
                                target={childOpenInNewTab ? '_blank' : undefined}
                                rel={childOpenInNewTab ? 'noopener noreferrer' : undefined}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-lg pl-8 pr-4 py-2.5 text-sm font-medium text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                              >
                                {child.label}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={childIndex}
                              to={childLink}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded-lg pl-8 pr-4 py-2.5 text-sm font-medium text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  }

                  if (isExternal) {
                    return (
                      <a
                        key={index}
                        href={link}
                        target={openInNewTab ? '_blank' : undefined}
                        rel={openInNewTab ? 'noopener noreferrer' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wider text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                      >
                        {item.label}
                      </a>
                    );
                  }

                  return (
                    <NavLink
                      key={index}
                      to={link}
                      end={link === localizedPath('/')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wider transition-colors ${
                          isActive
                            ? 'bg-jade/10 text-jade'
                            : 'text-midnight/70 hover:bg-champagne/30 hover:text-midnight'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  );
                })}

                <div className="my-6 border-t border-champagne/40" />

                {isAuthenticated ? (
                  <>
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.nameKey}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                        >
                          <Icon className="h-5 w-5" />
                          <span>{t(item.nameKey)}</span>
                        </Link>
                      );
                    })}

                    <button
                      onClick={() => {
                        userLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={localizedPath('/login')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>{t('nav.login')}</span>
                    </Link>
                    <Link
                      to={localizedPath('/signup')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium bg-jade/10 text-jade hover:bg-jade/20"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>{t('nav.signup')}</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}

export default Navbar;
