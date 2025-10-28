import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4" aria-label="Main">
        <Link to="/" className="text-2xl font-display uppercase tracking-[0.3em]">
          Luxia
        </Link>
        <div className="flex items-center gap-6 text-sm font-semibold uppercase tracking-widest">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'text-jade' : 'hover:text-jade')}>
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? 'text-jade' : 'hover:text-jade')}
          >
            Rituals
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) => (isActive ? 'text-jade' : 'hover:text-jade')}
          >
            Cart ({itemCount})
          </NavLink>
          <NavLink to="/admin/login" className="hover:text-jade">
            Admin
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
