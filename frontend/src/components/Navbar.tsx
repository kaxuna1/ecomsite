import { Link, NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4" aria-label="Main">
        <Link to="/" className="text-2xl font-display uppercase tracking-[0.3em]">
          {t('common.brand')}
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase tracking-widest text-midnight/70 sm:gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-jade' : 'hover:text-jade hover:text-opacity-100'}`
            }
          >
            {t('nav.home')}
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-jade' : 'hover:text-jade hover:text-opacity-100'}`
            }
          >
            {t('nav.rituals')}
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-jade' : 'hover:text-jade hover:text-opacity-100'}`
            }
          >
            <motion.span
              key={prefersReducedMotion ? 'cart-label' : `cart-${itemCount}`}
              initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="inline-flex items-center gap-1"
            >
              {t('nav.cartWithCount', { values: { count: itemCount } })}
              {!prefersReducedMotion && itemCount > 0 && (
                <motion.span
                  key={`dot-${itemCount}`}
                  className="relative block h-2 w-2 rounded-full bg-jade"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              )}
            </motion.span>
          </NavLink>
          <NavLink to="/admin/login" className="transition-colors hover:text-jade hover:text-opacity-100">
            {t('nav.admin')}
          </NavLink>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
