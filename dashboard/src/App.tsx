import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Toast } from './components/ui/Toast';
import { HomePage } from './pages/HomePage';
import { CommandsPage } from './pages/CommandsPage';
import { GuildSelectPage } from './pages/dashboard/GuildSelectPage';
import { GuildDashboard } from './pages/dashboard/GuildDashboard';
import { DevDashboard } from './pages/dev/DevDashboard';
import { NotFoundPage, ForbiddenPage } from './pages/ErrorPages';
import { useStore } from './store/useStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthChecked, ensureAuth } = useStore();

  // On mount, trigger a single auth check if we haven't checked yet
  useEffect(() => {
    if (!isAuthChecked) {
      ensureAuth();
    }
  }, [isAuthChecked, ensureAuth]);

  // If we have a user, render the protected content immediately
  if (user) return <>{children}</>;

  // Auth check completed but no user — redirect to home
  if (isAuthChecked) return <Navigate to="/" replace />;

  // Auth check still in progress — show a loading state instead of redirecting
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking authentication...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-bg text-text">
        <Navbar />
        <Toast />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/commands" element={<CommandsPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><GuildSelectPage /></ProtectedRoute>} />
          <Route path="/dashboard/:guildId/*" element={<ProtectedRoute><GuildDashboard /></ProtectedRoute>} />
          <Route path="/dev/*" element={<ProtectedRoute><DevDashboard /></ProtectedRoute>} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
