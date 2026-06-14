import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppButton } from '../ui/WhatsAppButton';

export const MainLayout = () => (
  <div className="min-h-screen flex flex-col bg-ink-50">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <WhatsAppButton />
  </div>
);
