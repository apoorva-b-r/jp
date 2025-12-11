import { Activity, LogOut } from 'lucide-react';

export function Header({ currentPage, isLoggedIn, onNavigate, onLogout }) {
  return (
    <header className="bg-surface border-b border-transparent sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Activity className="w-8 h-8 text-secondary" />
            <span className="text-2xl tracking-tight text-primary font-bold" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Jiggly Puffs
            </span>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors ${
                currentPage === 'home' ? 'text-secondary' : 'text-muted hover:text-secondary'
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
              className="text-muted hover:text-secondary transition-colors"
            >
              About
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}