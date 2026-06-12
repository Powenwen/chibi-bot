import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
  requireText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  requireText,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');

  const canConfirm = !requireText || inputValue === requireText;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(252, 165, 165, 0.1)' }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: '#FCA5A5' }} />
                </div>
                <h3 className="text-lg font-bold font-nunito" style={{ color: 'var(--text)' }}>{title}</h3>
              </div>
              <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>

            {requireText && (
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Type <span className="font-semibold" style={{ color: '#FCA5A5' }}>{requireText}</span> to confirm
                </label>
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder={`Type "${requireText}"`} />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-lighter)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                Cancel
              </button>
              <button onClick={onConfirm} disabled={!canConfirm}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: confirmVariant === 'danger' ? 'linear-gradient(135deg, #FCA5A5, #F472B6)' : 'linear-gradient(135deg, #38BDF8, #818CF8)',
                  color: 'white',
                }}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
