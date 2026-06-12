import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Sidebar } from '../../components/layout/Sidebar';
import { DevOverview } from './DevOverview';
import { DevStatus } from './DevStatus';
import { DevGuilds } from './DevGuilds';
import { DevUsers } from './DevUsers';
import { DevCommands } from './DevCommands';
import { DevLogs } from './DevLogs';
import { DevConfig } from './DevConfig';
import { DevAlerts } from './DevAlerts';

export function DevDashboard() {
  const { user, sidebarOpen } = useStore();

  if (!user || user.role !== 'developer') {
    return <Navigate to="/403" replace />;
  }

  return (
    <div className="min-h-screen pt-16">
      <Sidebar mode="dev" />
      <main
        className="transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 260 : 72 }}
      >
        <div className="p-6 lg:p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<DevOverview />} />
            <Route path="/status" element={<DevStatus />} />
            <Route path="/guilds" element={<DevGuilds />} />
            <Route path="/users" element={<DevUsers />} />
            <Route path="/commands" element={<DevCommands />} />
            <Route path="/logs" element={<DevLogs />} />
            <Route path="/config" element={<DevConfig />} />
            <Route path="/alerts" element={<DevAlerts />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
