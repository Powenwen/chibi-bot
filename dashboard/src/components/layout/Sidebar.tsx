import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PartyPopper, Pin, Smile, Bot, Lightbulb, Shield,
  Settings, ChevronLeft, ChevronRight, LogOut,
  BarChart3, Globe, Users, Command, FileText, Bell
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { GuildIcon } from '../../pages/dashboard/GuildSelectPage';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  children?: { label: string; path: string }[];
}

const userNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '' },
  { icon: PartyPopper, label: 'Welcome', path: '/welcome' },
  { icon: Pin, label: 'Sticky Messages', path: '/sticky' },
  { icon: Smile, label: 'Auto-Reactions', path: '/auto-reactions' },
  { icon: Bot, label: 'Auto-Responder', path: '/auto-responder' },
  { icon: Lightbulb, label: 'Suggestions', path: '/suggestions' },
  {
    icon: Shield,
    label: 'Moderation',
    path: '/moderation',
    children: [
      { label: 'Auto-Moderation', path: '/moderation/automod' },
      { label: 'Warning Escalation', path: '/moderation/escalation' },
      { label: 'Moderation Logs', path: '/moderation/logs' },
    ],
  },
  { icon: Settings, label: 'Server Settings', path: '/settings' },
];

const devNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Overview', path: '' },
  { icon: Globe, label: 'Bot Status', path: '/status' },
  { icon: Users, label: 'Guilds', path: '/guilds' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Command, label: 'Commands', path: '/commands' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: Settings, label: 'Configuration', path: '/config' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
];

interface SidebarProps {
  mode: 'user' | 'dev';
}

export function Sidebar({ mode }: SidebarProps) {
  const { sidebarOpen, toggleSidebar, logout, currentGuild } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedModeration, setExpandedModeration] = useState(true);

  const basePath = mode === 'user' ? `/dashboard/${currentGuild?.id || ''}` : '/dev';
  const navItems = mode === 'user' ? userNavItems : devNavItems;

  const isActive = (path: string) => {
    if (path === '') return location.pathname === basePath;
    return location.pathname === basePath + path;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 z-30 flex flex-col"
      style={{
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {mode === 'user' && currentGuild && sidebarOpen && (
          <div className="mb-4 px-3 pb-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <GuildIcon guild={currentGuild} size={40} />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{currentGuild.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentGuild.memberCount ? currentGuild.memberCount.toLocaleString() : '—'} members</div>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedModeration(!expandedModeration)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      color: active ? '#38BDF8' : 'var(--text-muted)',
                      background: active ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = 'var(--text)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <ChevronLeft
                          className="w-4 h-4 transition-transform"
                          style={{ transform: expandedModeration ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                        />
                      </>
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedModeration && sidebarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 mt-1 space-y-1"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={basePath + child.path}
                            className="block px-3 py-2 rounded-xl text-sm transition-all"
                            style={{
                              color: location.pathname === basePath + child.path ? '#38BDF8' : 'var(--text-muted)',
                              background: location.pathname === basePath + child.path ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                            }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={basePath + item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  color: active ? '#38BDF8' : 'var(--text-muted)',
                  background: active ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                }}
                title={!sidebarOpen ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all"
          style={{ color: 'var(--text-muted)' }}
          title={!sidebarOpen ? 'Logout' : undefined}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FCA5A5';
            e.currentTarget.style.background = 'rgba(252, 165, 165, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full flex items-center justify-center transition-all"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#38BDF8';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
