import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Terminal, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { commandsList } from '../data/mockData';

const categories = ['All', 'Fun', 'Moderation', 'Utility', 'Welcome System', 'Sticky Messages', 'Auto-Reactions', 'Auto-Responder', 'Suggestions'];

const categoryColors: Record<string, string> = {
  'All': '#38BDF8',
  'Fun': '#F472B6',
  'Moderation': '#FCA5A5',
  'Utility': '#38BDF8',
  'Welcome System': '#818CF8',
  'Sticky Messages': '#C084FC',
  'Auto-Reactions': '#FDE047',
  'Auto-Responder': '#86EFAC',
  'Suggestions': '#FDE047',
};

export function CommandsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = commandsList.filter((cmd) => {
    const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
    const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm transition-colors mb-6" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black font-nunito mb-3" style={{ color: 'var(--text)' }}>
            Command Reference
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Complete list of all Chibi Bot slash commands. Use <code className="px-1.5 py-0.5 rounded text-sm"
              style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>/</code> to get started.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeCategory === cat ? `${categoryColors[cat]}20` : 'var(--surface)',
                color: activeCategory === cat ? categoryColors[cat] : 'var(--text-muted)',
                border: `1px solid ${activeCategory === cat ? `${categoryColors[cat]}40` : 'var(--border)'}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((cmd, i) => (
            <motion.div key={cmd.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-xl p-5 transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" style={{ color: '#38BDF8' }} />
                  <code className="px-2 py-0.5 rounded text-sm font-mono"
                    style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>/{cmd.name}</code>
                </div>
                <span className="text-xs px-2 py-0.5 rounded w-fit"
                  style={{ background: 'var(--surface-lighter)', color: 'var(--text-muted)' }}>{cmd.category}</span>
                {cmd.permissions !== 'None' && (
                  <span className="text-xs px-2 py-0.5 rounded w-fit flex items-center gap-1"
                    style={{ background: 'rgba(253, 224, 71, 0.12)', color: '#FDE047' }}>
                    <Shield className="w-3 h-3" /> {cmd.permissions}
                  </span>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{cmd.description}</p>
              <code className="text-xs font-mono" style={{ color: 'var(--text-dark)' }}>Usage: {cmd.usage}</code>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
