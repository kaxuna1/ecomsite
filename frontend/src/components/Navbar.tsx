import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { getFavorites } from '../api/favorites';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
  const { items, total, removeItem } = useCart();
  const { user, isAuthenticated, userLogout } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch favorites count
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  const favoritesCount = favorites?.length || 0;

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.products'), href: '/products' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Best Sellers', href: '/best-sellers' },
    { name: 'Sale', href: '/sale' }
  ];

  const userMenuItems = [
    { name: 'Profile', href: '/account/profile', icon: UserCircleIcon },
    { name: 'Orders', href: '/account/orders', icon: ShoppingBagIcon },
    { name: 'Favorites', href: '/account/favorites', icon: HeartIcon }
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-midnight py-2 text-center text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4">
          <TruckIcon className="h-4 w-4" />
          <span>FREE SHIPPING OVER $50 | NEW CUSTOMER? GET 10% OFF WITH CODE: WELCOME10</span>
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
            <Link to="/" className="group flex items-center">
              <motion.span
                className="text-2xl font-display uppercase tracking-[0.3em] text-midnight transition-colors group-hover:text-jade lg:text-3xl"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {t('common.brand')}
              </motion.span>
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `relative text-sm font-semibold uppercase tracking-wider transition-colors ${
                      isActive ? 'text-jade' : 'text-midnight/70 hover:text-jade'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.name}
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
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Search */}
              <div className="relative">
                {searchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex items-center"
                  >
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full rounded-full border border-champagne/60 bg-champagne/20 px-4 py-2 pr-10 text-sm text-midnight placeholder-midnight/50 focus:border-jade focus:outline-none focus:ring-2 focus:ring-jade/20"
                      autoFocus
                      onBlur={() => {
                        if (!searchQuery) setSearchOpen(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchOpen(false);
                      }}
                      className="absolute right-3 text-midnight/50 hover:text-midnight"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="group relative p-2 text-midnight/70 transition-colors hover:text-jade"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </button>
                )}
              </div>

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
                              key={item.name}
                              to={item.href}
                              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-midnight/70 transition-colors hover:bg-champagne/30 hover:text-midnight"
                            >
                              <Icon className="h-5 w-5" />
                              {item.name}
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
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-midnight/70 transition-colors hover:text-jade"
                  aria-label="Login"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden lg:inline">Login</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to="/account/favorites"
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
                  to="/cart"
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
                        <h3 className="font-display text-lg text-midnight">Your Cart</h3>
                        <span className="text-sm text-midnight/60">{itemCount} items</span>
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
                                Qty: {quantity} × ${product.price.toFixed(2)}
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
                            +{items.length - 3} more items
                          </p>
                        )}
                      </div>

                      <div className="mt-4 space-y-3 border-t border-champagne/40 pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-midnight">Subtotal:</span>
                          <span className="font-bold text-jade">${total.toFixed(2)}</span>
                        </div>
                        <Link
                          to="/cart"
                          className="block w-full rounded-full bg-jade py-3 text-center text-sm font-semibold text-white transition-all hover:bg-jade/90 hover:shadow-lg"
                        >
                          View Cart
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
                  {t('common.brand')}
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
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-jade/10 text-jade'
                          : 'text-midnight/70 hover:bg-champagne/30 hover:text-midnight'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}

                <div className="my-6 border-t border-champagne/40" />

                {isAuthenticated ? (
                  <>
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
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
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-midnight/70 hover:bg-champagne/30 hover:text-midnight"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium bg-jade/10 text-jade hover:bg-jade/20"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
