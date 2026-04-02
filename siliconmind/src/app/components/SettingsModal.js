'use client';
import { useState } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const [maxTokens, setMaxTokens] = useState(512);
  const [agenticMode, setAgenticMode] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [mathEnabled, setMathEnabled] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Store settings in localStorage so they persist
    localStorage.setItem('siliconmind_settings', JSON.stringify({
      maxTokens, agenticMode, searchEnabled, mathEnabled, theme
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: enabled ? 'var(--accent-copper)' : 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0
      }}
    >
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: enabled ? 'var(--text-inverse)' : 'var(--text-muted)',
        position: 'absolute', top: '2px',
        left: enabled ? '20px' : '2px',
        transition: 'left 0.2s'
      }} />
    </button>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: '12px', padding: '0', width: '480px', maxHeight: '80vh', overflow: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-copper)" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '1px' }}>SYSTEM CONFIGURATION</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        {/* Settings Content */}
        <div style={{ padding: '24px' }}>
          
          {/* Model Section */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '12px' }}>MODEL ENGINE</div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Llama-3.3-70b-versatile</span>
                <span style={{ fontSize: '10px', color: 'var(--accent-green-bright)', fontFamily: 'var(--font-mono)' }}>ONLINE</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Groq LPU Inference • 70B Parameters</div>
            </div>
          </div>

          {/* Response Length */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '12px' }}>RESPONSE LENGTH</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input 
                type="range" min="128" max="2048" step="128" value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-copper)' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', minWidth: '60px', textAlign: 'right' }}>{maxTokens} tok</span>
            </div>
          </div>

          {/* Agent Toggles */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '12px' }}>AGENTIC CAPABILITIES</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>Orchestration Swarm</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Multi-agent tool routing</div>
                </div>
                <ToggleSwitch enabled={agenticMode} onToggle={() => setAgenticMode(!agenticMode)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>Web Search</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>DuckDuckGo real-time lookup</div>
                </div>
                <ToggleSwitch enabled={searchEnabled} onToggle={() => setSearchEnabled(!searchEnabled)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>Math Engine</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>NumPy sandboxed computation</div>
                </div>
                <ToggleSwitch enabled={mathEnabled} onToggle={() => setMathEnabled(!mathEnabled)} />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '12px' }}>APPEARANCE</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['dark', 'industrial', 'midnight'].map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)',
                  background: theme === t ? 'var(--accent-copper-dim)' : 'var(--bg-surface)',
                  border: theme === t ? '1px solid var(--accent-copper)' : '1px solid var(--border-subtle)',
                  color: theme === t ? 'var(--accent-copper)' : 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} style={{ 
            width: '100%', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
            fontFamily: 'var(--font-mono)', letterSpacing: '2px', transition: 'all 0.2s',
            background: saved ? 'var(--accent-green)' : 'var(--accent-copper)', 
            color: 'var(--text-inverse)'
          }}>
            {saved ? '✓ CONFIGURATION SAVED' : 'SAVE CONFIGURATION'}
          </button>
        </div>

        {/* Footer Info */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SiliconMind Pro v1.06</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Groq LPU Runtime</span>
        </div>
      </div>
    </div>
  );
}
