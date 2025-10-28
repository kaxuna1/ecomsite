import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import HreflangTags from './HreflangTags';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-champagne via-white to-blush">
      <HreflangTags />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
