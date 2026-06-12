import { motion } from 'framer-motion';
import {
  Server, Users, Command, Clock, Zap, Cpu, HardDrive,
  AlertTriangle
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { botStats, dailyCommands, commandStats } from '../../data/mockData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const errors = [
  { timestamp: '2024-03-21 08:23:14', type: 'DiscordAPIError', message: 'Unknown Message' },
  { timestamp: '2024-03-21 07:15:02', type: 'MongoError', message: 'Connection timeout after 30000ms' },
  { timestamp: '2024-03-21 06:42:33', type: 'TypeError', message: "Cannot read property 'id' of undefined" },
  { timestamp: '2024-03-21 05:11:09', type: 'DiscordAPIError', message: 'Missing Permissions' },
  { timestamp: '2024-03-21 04:58:47', type: 'RedisError', message: 'Connection refused' },
];

const chartTooltipStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
};

export function DevOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Developer Overview</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time bot statistics and health monitoring</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Server} label="Total Guilds" value={botStats.guilds.toLocaleString()} delay={0} />
        <StatCard icon={Users} label="Total Users" value={botStats.users.toLocaleString()} delay={0.1} />
        <StatCard icon={Command} label="Commands Today" value={botStats.commandsToday.toLocaleString()} delay={0.2} />
        <StatCard icon={Command} label="Commands All-Time" value={botStats.commandsRun.toLocaleString()} delay={0.3} />
        <StatCard icon={Clock} label="Uptime" value="99.97%" delay={0.4} />
        <StatCard icon={Zap} label="API Latency" value={`${botStats.ping}ms`} delay={0.5} />
        <StatCard icon={HardDrive} label="Memory Usage" value={`${botStats.memory}MB`} delay={0.6} />
        <StatCard icon={Cpu} label="CPU Usage" value={`${botStats.cpu}%`} delay={0.7} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>Commands Executed (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCommands}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: '#38BDF8' }} />
                <Line type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>Top 10 Commands</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commandStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={80} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: '#38BDF8' }} />
                <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" style={{ color: '#FDE047' }} />
          <h3 className="text-lg font-bold font-nunito" style={{ color: 'var(--text)' }}>Recent Errors</h3>
        </div>
        <div className="space-y-2">
          {errors.map((error, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg px-4 py-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{error.timestamp}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' }}>{error.type}</span>
              <span className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{error.message}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
