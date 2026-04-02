'use client';
import { useState } from 'react';

export default function Header({ 
  isSidebarOpen, 
  onToggleSidebar, 
  sessionTitle, 
  onOpenSettings,
  searchQuery,
  setSearchQuery,
  isSearching,
  setIsSearching
}) {

  return (
    <header className="header" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        {!isSidebarOpen && (
          <button onClick={onToggleSidebar} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '6px' }} title="Open sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        )}
        
        {isSearching ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '500px', background: 'var(--bg-surface)', padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-copper)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setIsSearching(false)}
              placeholder="Search conversations, assets, agents..."
              style={{ 
                background: 'transparent', border: 'none', 
                color: 'var(--text-primary)', fontSize: '13px', width: '100%', outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} style={{ color: 'var(--text-muted)', display: 'flex', padding: '2px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '500', color: 'var(--accent-copper)', letterSpacing: '1px' }}>
            {sessionTitle ? `LOG // ${sessionTitle.slice(0, 50).toUpperCase()}` : "SYSTEM // READY"}
          </span>
        )}
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {!isSearching && (
          <div style={{ 
            fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', 
            padding: '4px 12px', border: '1px solid var(--border-subtle)', borderRadius: '20px', marginRight: '8px'
          }}>
            LPU // Llama 3.3 · PRO
          </div>
        )}
        <button 
          onClick={() => setIsSearching(!isSearching)} 
          style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: isSearching ? 'var(--accent-copper)' : 'var(--text-secondary)', transition: 'all 0.15s' }}
          title="Search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
        <button 
          onClick={onOpenSettings} 
          style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </header>
  );
}
