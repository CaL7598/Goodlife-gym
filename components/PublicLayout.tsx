
import React from 'react';
import { Menu, X, Dumbbell, User } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: string) => void;
  currentPage: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, setCurrentPage, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'plans', label: 'Plans' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'announcements', label: 'News' },
    { id: 'contact', label: 'Contact' },
    { id: 'checkin', label: 'Check In' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <Dumbbell className="text-rose-600 h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">GOODLIFE <span className="text-rose-600">FITNESS</span></span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === item.id ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage('admin-login')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <User size={16} />
                Portal
              </button>
            </nav>

            {/* Mobile Nav Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-rose-600 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setCurrentPage('admin-login');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Staff Portal
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="text-rose-500 h-6 w-6" />
                <span className="text-lg font-bold text-white">GOODLIFE FITNESS</span>
              </div>
              <p className="text-sm max-w-sm leading-relaxed">
                Empowering your journey to a healthier, stronger life. Join our community and experience world-class facilities and expert coaching.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setCurrentPage('plans')} className="hover:text-rose-400">Memberships</button></li>
                <li><button onClick={() => setCurrentPage('gallery')} className="hover:text-rose-400">Facility Tour</button></li>
                <li><button onClick={() => setCurrentPage('equipment')} className="hover:text-rose-400">Equipment & Repair</button></li>
                <li><button onClick={() => setCurrentPage('announcements')} className="hover:text-rose-400">Announcements</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Hours</h3>
              <ul className="space-y-2 text-sm">
                <li>Mon - Fri: 5:00 AM - 11:00 AM</li>
                <li className="ml-4">4:00 PM - 8:00 PM</li>
                <li>Saturday: 5:00 AM - 11:00 AM</li>
                <li className="ml-4">5:00 PM - 7:30 PM</li>
                <li className="mt-2 text-rose-400">Aerobics: Mon, Wed, Sat 6:00 AM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Goodlife Fitness Center. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
