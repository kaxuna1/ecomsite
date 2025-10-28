import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4" aria-label="Main">
        <Link to="/" className="group flex items-center">
          <motion.span
            className="text-2xl font-display uppercase tracking-[0.3em] text-midnight transition-colors group-hover:text-jade"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {t('common.brand')}
          </motion.span>
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase tracking-widest text-midnight/70 sm:gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `relative transition-colors ${isActive ? 'text-jade' : 'hover:text-jade'}`
            }
          >
            {({ isActive }) => (
              <>
                {t('nav.home')}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-jade"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `relative transition-colors ${isActive ? 'text-jade' : 'hover:text-jade'}`
            }
          >
            {({ isActive }) => (
              <>
                {t('nav.products')}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-jade"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `relative flex items-center gap-2 transition-colors ${isActive ? 'text-jade' : 'hover:text-jade'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <ShoppingBagIcon className="h-5 w-5" />
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
                <span className="hidden sm:inline">{t('nav.cart')}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-jade"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/login"
            className={({ isActive }) =>
              `relative transition-colors ${isActive ? 'text-jade' : 'hover:text-jade'}`
            }
          >
            {({ isActive }) => (
              <>
                {t('nav.admin')}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-jade"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
