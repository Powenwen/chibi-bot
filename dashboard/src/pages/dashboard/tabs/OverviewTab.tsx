import { useEffect, useState } from 'react';
import {
  Users, Settings, Lightbulb, Shield, PartyPopper, Pin, Smile, Bot,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import { FeatureToggle } from '../../../components/ui/FeatureToggle';
import { useStore } from '../../../store/useStore';
import { getModLogs, getFeatureStates, toggleFeature, getBotPermissions, type ModerationCase, type FeatureStates, type BotPermissionInfo } from '../../../services/guildApi';

const featureCards = [
  { icon: PartyPopper, title: 'Welcome System', description: 'Greet new members with custom messages', key: 'welcome' },
  { icon: Pin, title: 'Sticky Messages', description: 'Keep important messages visible', key: 'sticky' },
  { icon: Smile, title: 'Auto-Reactions', description: 'Auto-react to messages with emoji', key: 'autoreactions' },
  { icon: Bot, title: 'Auto-Responder', description: 'Keyword-triggered auto replies', key: 'autoresponder' },
  { icon: Lightbulb, title: 'Suggestions', description: 'Community suggestion workflow', key: 'suggestions' },
  { icon: Shield, title: 'Moderation', description: 'Warnings, bans, and auto-mod', key: 'moderation' },
];

const REQUIRED_PERMISSIONS = [
  'Manage Server',
  'Manage Messages',
  'Manage Roles',
  'Kick Members',
  'Ban Members',
  'Manage Channels',
  'View Audit Log',
  'Moderate Members',
];

const actionBadgeStyles: Record<string, { bg: string; color: string }> = {
  Ban: { bg: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' },
  Warn: { bg: 'rgba(253, 224, 71, 0.12)', color: '#FDE047' },
  Mute: { bg: 'rgba(129, 140, 248, 0.12)', color: '#818CF8' },
  Kick: { bg: 'rgba(253, 224, 71, 0.12)', color: '#FDE047' },
  Unban: { bg: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' },
  Timeout: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' },
};

export function OverviewTab() {
  const { currentGuild, showToast } = useStore();
  const [recentLogs, setRecentLogs] = useState<ModerationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureStates, setFeatureStates] = useState<FeatureStates | null>(null);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
  const [botPerms, setBotPerms] = useState<BotPermissionInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) { setLoading(false); return; }
      try {
        const [logsRes, featuresRes, botPermsRes] = await Promise.all([
          getModLogs(currentGuild.id, { limit: 5 }),
          getFeatureStates(currentGuild.id),
          getBotPermissions(currentGuild.id),
        ]);
        if (!mounted) return;
        setRecentLogs(logsRes.logs || []);
        setFeatureStates(featuresRes);
        setBotPerms(botPermsRes);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleToggle = async (featureKey: string) => {
    if (!currentGuild || togglingFeature) return;
    const currentState = featureStates?.[featureKey as keyof FeatureStates] ?? false;
    setTogglingFeature(featureKey);
    try {
      await toggleFeature(currentGuild.id, featureKey, !currentState);
      setFeatureStates((prev) => prev ? { ...prev, [featureKey]: !currentState } : prev);
      showToast(`${featureKey} ${!currentState ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      console.error('Failed to toggle feature', err);
      showToast('Failed to toggle feature', 'error');
    } finally {
      setTogglingFeature(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Members" value="—" delay={0} />
        <StatCard icon={Settings} label="Channels" value="—" delay={0.1} />
        <StatCard icon={Shield} label="Recent Actions" value={String(recentLogs.length)} delay={0.2} />
        <StatCard icon={CheckCircle} label="Features Active" value={currentGuild?.features?.length || 0} delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>Quick Toggles</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {featureCards.map((feature) => (
                <FeatureToggle
                  key={feature.key}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  enabled={featureStates?.[feature.key as keyof FeatureStates] ?? false}
                  loading={togglingFeature === feature.key}
                  onToggle={() => handleToggle(feature.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>Recent Activity</h3>
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {loading ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : recentLogs.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No recent activity</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Case</th>
                        <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Action</th>
                        <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Target</th>
                        <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Moderator</th>
                        <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log) => {
                        const badge = actionBadgeStyles[log.type] || { bg: 'var(--surface-lighter)', color: 'var(--text-muted)' };
                        return (
                          <tr key={log._id} className="transition-colors hover:bg-[var(--bg-light)]"
                            style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text)' }}>{log.caseID}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ background: badge.bg, color: badge.color }}>
                                {log.type}
                              </span>
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{log.userID}</td>
                            <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{log.moderatorID}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {new Date(log.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Bot Permissions</h3>
            {botPerms?.hasAdministrator ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(134, 239, 172, 0.08)', border: '1px solid rgba(134, 239, 172, 0.2)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#86EFAC' }} />
                <span className="text-sm font-medium" style={{ color: '#86EFAC' }}>Administrator — All Permissions Granted</span>
              </div>
            ) : (
              <div className="space-y-3">
                {REQUIRED_PERMISSIONS.map((permName) => {
                  const isMissing = botPerms?.missingPermissions?.includes(permName);
                  return (
                    <div key={permName} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{permName}</span>
                      {isMissing ? (
                        <XCircle className="w-4 h-4" style={{ color: '#FCA5A5' }} />
                      ) : (
                        <CheckCircle className="w-4 h-4" style={{ color: '#86EFAC' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {botPerms && botPerms.missingPermissions.length > 0 && !botPerms.hasAdministrator && (
            <div className="rounded-xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid rgba(252, 165, 165, 0.2)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#FCA5A5' }}>
                <AlertTriangle className="w-4 h-4" /> Missing Permissions
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                The bot is missing the following permissions. Re-invite the bot with the required permissions for full functionality.
              </p>
              <div className="flex flex-wrap gap-2">
                {botPerms.missingPermissions.map((perm) => (
                  <span key={perm} className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(252, 165, 165, 0.1)', color: '#FCA5A5', border: '1px solid rgba(252, 165, 165, 0.2)' }}>
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
