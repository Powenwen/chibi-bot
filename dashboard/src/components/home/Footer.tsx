import { MessageCircle, Heart, Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer id="support" className="relative border-t overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <div className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.05) 0%, transparent 60%)',
        }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/chibi-icon.png"
                alt="Chibi Bot"
                className="w-9 h-9 rounded-xl object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.chibi-fallback-footer') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-9 h-9 rounded-xl items-center justify-center text-white font-bold text-lg font-nunito hidden chibi-fallback-footer"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #C084FC)' }}>
                C
              </div>
              <span className="font-bold text-lg font-nunito" style={{ color: 'var(--text)' }}>Chibi Bot</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Your server's friendly guardian. Built with care for Discord communities of all sizes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>Features</a></li>
              <li><a href="/commands" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>Commands</a></li>
              <li><a href="#" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Support</h4>
            <ul className="space-y-2">
              <li><a href="https://discord.gg/chibimation" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>Discord Server</a></li>
              <li><a href="https://github.com/Powenwen/chibi-bot" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>GitHub</a></li>
              <li><a href="#" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a></li>
              <li><a href="#" className="text-sm transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {['TypeScript', 'MongoDB', 'Redis', 'Discord.js'].map((tech) => (
                <span key={tech} className="px-2 py-1 text-xs rounded-md"
                  style={{ background: 'var(--surface-lighter)', color: 'var(--text-muted)' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Powenwen/chibi-bot" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>
              <Code2 className="w-5 h-5" />
            </a>
            <a href="https://discord.gg/chibimation" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:text-[#38BDF8]" style={{ color: 'var(--text-muted)' }}>
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-dark)' }}>
            Made with <Heart className="w-3 h-3" style={{ color: '#F472B6' }} /> by the Chibi team. ISC License.
          </p>
        </div>
      </div>
    </footer>
  );
}
