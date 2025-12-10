import { Activity, LogOut } from 'lucide-react';

export function Header({ currentPage, isLoggedIn, onNavigate, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Activity className="w-8 h-8 text-[#0EA5E9]" />
            <span className="text-2xl tracking-tight text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Jiggly Pugffs
            </span>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#0EA5E9] transition-colors ${
                currentPage === 'home' ? 'text-[#0EA5E9]' : 'text-gray-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('about-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onNavigate('home');
                  setTimeout(() => {
                    const el = document.getElementById('about-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="text-gray-600 hover:text-[#0EA5E9] transition-colors"
            >
              About
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}