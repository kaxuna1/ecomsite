import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-midnight text-champagne">
      <header className="border-b border-white/10 bg-midnight/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <p className="font-display text-lg uppercase tracking-[0.3em]">Luxia Admin</p>
          <nav className="flex gap-6 text-xs uppercase tracking-widest">
            <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'text-blush' : 'hover:text-blush')}>
              Overview
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) => (isActive ? 'text-blush' : 'hover:text-blush')}
            >
              Products
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => (isActive ? 'text-blush' : 'hover:text-blush')}
            >
              Orders
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="text-left uppercase tracking-widest text-champagne/60 hover:text-blush"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
