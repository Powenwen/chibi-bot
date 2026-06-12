import { create } from 'zustand';
import { getCurrentUser, getUserGuilds, logout as apiLogout } from '../services/auth';

// Re-export lightweight types used across the dashboard (kept as any to avoid
// duplicating API shapes here). These provide compatibility for existing
// mock data and components that imported types from the store previously.
export type WelcomeConfig = any;
export type StickyMessage = any;
export type AutoReaction = any;
export type AutoResponder = any;
export type Suggestion = any;
export type ModLog = any;
export type EscalationRule = any;
export type AutomodConfig = any;

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  discriminator?: string;
  role: 'anonymous' | 'user' | 'developer';
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  features: string[];
  memberCount?: number;
  channelCount?: number;
  roleCount?: number;
  botInGuild?: boolean;
  ownerId?: string;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export interface AppState {
  user: User | null;
  guilds: Guild[];
  currentGuild: Guild | null;
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  toast: ToastMessage | null;
  loading: boolean;
  isAuthChecked: boolean;

  ensureAuth: () => Promise<void>;
  login: (user: User) => void;
  logout: () => void;
  loadGuilds: () => Promise<void>;
  handleUnauthorized: () => void;

  setCurrentGuild: (guild: Guild | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  clearToast: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  guilds: [],
  currentGuild: null,
  theme: 'dark',
  sidebarOpen: true,
  toast: null,
  loading: false,
  isAuthChecked: false,

  /** Lazily check session — called by ProtectedRoute on first visit */
  ensureAuth: async () => {
    if (get().user) { set({ isAuthChecked: true }); return; } // already loaded
    try {
      console.log('[Store] ensureAuth: checking session...');
      const user = await getCurrentUser();
      if (user) {
        console.log('[Store] ensureAuth: user =', user.username);
        set({
          user: {
            id: user.id,
            username: user.username,
            avatar: (user as any).avatarUrl || user.avatar || null,
            discriminator: user.discriminator || undefined,
            role: user.role || 'user',
          },
          isAuthChecked: true,
        });
        get().loadGuilds();
      } else {
        set({ isAuthChecked: true });
      }
    } catch (err) {
      console.log('[Store] ensureAuth: no session');
      set({ isAuthChecked: true });
    }
  },

  login: (user) => set({ user }),

  logout: () => {
    // call backend logout and clear store
    apiLogout().catch(() => {});
    set({ user: null, currentGuild: null, guilds: [], isAuthChecked: true });
  },

  /** Called by the API interceptor when a 401 is detected */
  handleUnauthorized: () => {
    console.log('[Store] handleUnauthorized: clearing auth state');
    set({ user: null, currentGuild: null, guilds: [], isAuthChecked: true });
    // Redirect to home
    window.location.hash = '/';
  },

  loadGuilds: async () => {
    try {
      console.log('[Store] loadGuilds: fetching...');
      const dg = await getUserGuilds();
      console.log('[Store] loadGuilds: got', dg.length, 'guilds');
      const guilds: Guild[] = dg.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        permissions: g.permissions,
        features: g.features || [],
        botInGuild: (g as any).botInGuild || false,
      }));
      set({ guilds });
    } catch (err) {
      console.error('[Store] loadGuilds error:', err);
    }
  },

  setCurrentGuild: (guild) => set({ currentGuild: guild }),

  setTheme: (theme) => {
    document.body.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  showToast: (message, type) => set({ toast: { message, type } }),

  clearToast: () => set({ toast: null }),
}));
