import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShieldAlert, Frown } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <Frown className="w-12 h-12" style={{ color: '#38BDF8' }} />
        </div>
        <h1 className="text-5xl font-black font-nunito mb-4" style={{ color: 'var(--text)' }}>404</h1>
        <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          Oops! This page doesn't exist. Chibi is confused too.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #C084FC)' }}
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(252, 165, 165, 0.1)', border: '1px solid rgba(252, 165, 165, 0.2)' }}>
          <ShieldAlert className="w-12 h-12" style={{ color: '#FCA5A5' }} />
        </div>
        <h1 className="text-5xl font-black font-nunito mb-4" style={{ color: 'var(--text)' }}>403</h1>
        <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          You don't have access to this area. Only bot developers can enter here!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #C084FC)' }}
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
