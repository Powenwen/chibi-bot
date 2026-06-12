import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { commandsList } from '../../data/mockData';

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

export function CommandPreview() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = commandsList.filter((cmd) => {
    const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
    const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(192,132,252,0.05) 0%, transparent 50%)',
        }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black font-nunito mb-4" style={{ color: 'var(--text)' }}>
            Command Reference
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            A preview of what Chibi Bot can do. Search and filter commands by category.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dark)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>
          <Link
            to="/commands"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all hover:scale-105 glow-brand"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}
          >
            <Terminal className="w-4 h-4" /> View All Commands
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeCategory === cat ? `${categoryColors[cat]}20` : 'var(--surface)',
                color: activeCategory === cat ? categoryColors[cat] : 'var(--text-muted)',
                border: `1px solid ${activeCategory === cat ? `${categoryColors[cat]}40` : 'var(--border)'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 9).map((cmd, i) => (
            <motion.div
              key={cmd.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4 transition-all duration-300"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <code className="px-2 py-0.5 rounded text-xs font-mono"
                  style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>
                  /{cmd.name}
                </code>
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--surface-lighter)', color: 'var(--text-dark)' }}>
                  {cmd.category}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{cmd.description}</p>
              <div className="text-xs" style={{ color: 'var(--text-dark)' }}>
                {cmd.permissions !== 'None' ? `Requires: ${cmd.permissions}` : 'No permissions required'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
