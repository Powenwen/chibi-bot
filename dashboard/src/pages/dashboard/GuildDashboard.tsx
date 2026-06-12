import { useEffect } from 'react';
import { useParams, Routes, Route, Navigate } from 'react-router-dom';
 
import { Sidebar } from '../../components/layout/Sidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { WelcomeTab } from './tabs/WelcomeTab';
import { StickyTab } from './tabs/StickyTab';
import { AutoReactionsTab } from './tabs/AutoReactionsTab';
import { AutoResponderTab } from './tabs/AutoResponderTab';
import { SuggestionsTab } from './tabs/SuggestionsTab';
import { AutoModTab } from './tabs/AutoModTab';
import { EscalationTab } from './tabs/EscalationTab';
import { LogsTab } from './tabs/LogsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { useStore } from '../../store/useStore';

export function GuildDashboard() {
  const { guildId } = useParams<{ guildId: string }>();
  const { currentGuild, setCurrentGuild, sidebarOpen, guilds } = useStore();

  useEffect(() => {
    if (guildId && (!currentGuild || currentGuild.id !== guildId)) {
      const guild = guilds.find((g) => g.id === guildId);
      if (guild) setCurrentGuild(guild);
    }
  }, [guildId, currentGuild, setCurrentGuild, guilds]);

  if (!currentGuild) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen pt-16">
      <Sidebar mode="user" />
      <main
        className="transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 260 : 72 }}
      >
        <div className="p-6 lg:p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<OverviewTab />} />
            <Route path="/welcome" element={<WelcomeTab />} />
            <Route path="/sticky" element={<StickyTab />} />
            <Route path="/auto-reactions" element={<AutoReactionsTab />} />
            <Route path="/auto-responder" element={<AutoResponderTab />} />
            <Route path="/suggestions" element={<SuggestionsTab />} />
            <Route path="/moderation/automod" element={<AutoModTab />} />
            <Route path="/moderation/escalation" element={<EscalationTab />} />
            <Route path="/moderation/logs" element={<LogsTab />} />
            <Route path="/settings" element={<SettingsTab />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
