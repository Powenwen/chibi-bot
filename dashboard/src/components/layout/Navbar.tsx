import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, LogOut, Shield, User, ChevronDown, Sun, Moon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { loginWithDiscord } from '../../services/auth';

export function Navbar() {
  const { user, logout, theme, setTheme } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize theme on mount
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const isHome = location.pathname === '/';

  const navLinks = isHome
    ? [
        { label: 'Features', href: '#features' },
        { label: 'Commands', href: '/commands' },
        { label: 'Support', href: '#support' },
        { label: 'GitHub', href: 'https://github.com/Powenwen/chibi-bot' },
      ]
    : [];

  const handleLogin = () => {
    // Redirect to backend OAuth endpoint
    loginWithDiscord();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/chibi-icon.png"
              alt="Chibi Bot"
              className="w-9 h-9 rounded-xl object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.chibi-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-secondary)] items-center justify-center text-white font-bold text-lg font-nunito hidden chibi-fallback">
              C
            </div>
            <span className="font-bold text-lg font-nunito text-[var(--color-text)]">Chibi Bot</span>
          </Link>

          {isHome && (
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href.startsWith('#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-surface-light)] transition-colors"
                >
                  <img src={user.avatar || undefined} alt="" className="w-7 h-7 rounded-full ring-2 ring-[var(--color-brand)]/30" />
                  <span className="text-sm font-medium text-[var(--color-text)] hidden sm:block">{user.username}</span>
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl py-1.5 overflow-hidden"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)] transition-colors"
                      >
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      {user.role === 'developer' && (
                        <Link
                          to="/dev"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)] transition-colors"
                        >
                          <Shield className="w-4 h-4" /> Developer
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogin}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-discord)] to-[var(--color-secondary)] hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity shadow-lg shadow-[var(--color-discord)]/20"
                >
                  <LogIn className="w-4 h-4" /> Login with Discord
                </button>
                <button
                  onClick={handleLogin}
                  className="sm:hidden p-2 bg-gradient-to-r from-[var(--color-discord)] to-[var(--color-secondary)] text-white rounded-xl transition-opacity"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </div>
            )}

            {isHome && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && isHome && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[var(--color-border)] overflow-hidden"
            style={{ background: 'var(--color-bg)' }}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 rounded-xl transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
