'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AgentStatus from './AgentStatus';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function Sidebar({ isOpen, onToggle, onDocumentsChange, activeSessionId, onSelectSession, onNewChat, onDeleteSession, refreshTrigger, activeTools = [] }) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const fileInputRef = useRef(null);

  // Fetch documents and sessions on mount or when refreshTrigger changes
  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, [refreshTrigger]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
      if (onDocumentsChange) onDocumentsChange(data.documents || []);
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are supported currently.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BACKEND_URL}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadProgress(`✅ ${data.chunks_created} chunks created from ${data.pages_extracted} pages`);
        setTimeout(() => setUploadProgress(''), 3000);
        fetchDocuments();
      } else {
        setUploadProgress(`❌ ${data.detail || 'Upload failed'}`);
        setTimeout(() => setUploadProgress(''), 4000);
      }
    } catch (err) {
      setUploadProgress(`❌ Connection error`);
      setTimeout(() => setUploadProgress(''), 3000);
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-uploaded
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docName) => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/documents/${encodeURIComponent(docName)}`, {
        method: 'DELETE',
      });
      fetchDocuments();
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  const handleRename = async (sessionId) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await fetch(`${BACKEND_URL}/api/v1/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle }),
      });
      setEditingSessionId(null);
      fetchSessions();
    } catch (e) {
      console.error('Failed to rename session:', e);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent-copper), #B8875A)', 
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="1.5">
              <rect x="6" y="6" width="12" height="12" rx="1"/>
              <path d="M6 9H3M6 12H3M6 15H3M18 9h3M18 12h3M18 15h3M9 6V3M12 6V3M15 6V3M9 18v3M12 18v3M15 18v3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '1.5px' }}>SILICONMIND</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--accent-copper)', letterSpacing: '2px' }}>PRO · ENGINEERING</div>
          </div>
        </div>
        <button onClick={onToggle} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', transition: 'all 0.15s' }} title="Collapse sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      {/* Main Navigation */}
      <div style={{ padding: '16px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="nav-item" style={{ 
            padding: '10px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)',
            background: pathname === '/' ? 'var(--bg-surface)' : 'transparent',
            border: pathname === '/' ? '1px solid var(--accent-copper)' : '1px solid transparent'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Chat & Search
          </div>
        </Link>
        <Link href="/explore" style={{ textDecoration: 'none' }}>
          <div className="nav-item" style={{ 
            padding: '10px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)',
            background: pathname === '/explore' ? 'var(--bg-surface)' : 'transparent',
            border: pathname === '/explore' ? '1px solid var(--accent-copper)' : '1px solid transparent'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            Knowledge Graph
          </div>
        </Link>
        <Link href="/lab" style={{ textDecoration: 'none' }}>
          <div className="nav-item" style={{ 
            padding: '10px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)',
            background: pathname === '/lab' ? 'var(--bg-surface)' : 'transparent',
            border: pathname === '/lab' ? '1px solid var(--accent-copper)' : '1px solid transparent'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
            Design Lab
          </div>
        </Link>
      </div>

      {/* New Session (Only if on Chat page) */}
      {pathname === '/' && (
        <div style={{ padding: '16px' }}>
          <button onClick={onNewChat} style={{ 
            width: '100%', border: '1px solid var(--border-subtle)', 
            background: 'var(--bg-surface)', padding: '10px 16px', fontSize: '12px', 
            fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.15s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Session
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Scrollable Content */}
      <div className="sidebar-scroll">
        {/* Chat Sessions */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">CHRONO_LOGS</div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
              onClick={() => onSelectSession(session.id)}
              style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.4 }}>#{session.id.slice(0, 4)}</span>
                {editingSessionId === session.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(session.id)}
                    onBlur={() => handleRename(session.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-copper)', color: 'var(--text-primary)', fontSize: '11px', outline: 'none', width: '100%', padding: '2px 4px' }}
                  />
                ) : (
                  <span className="session-item-text" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.title.toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="item-actions" style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditTitle(session.title); }}
                  style={{ fontSize: '10px', color: 'var(--text-muted)' }}
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  style={{ fontSize: '10px', color: 'var(--text-muted)' }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="sidebar-section">
          <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            LOCAL_ASSETS
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              style={{ fontSize: '14px', color: 'var(--accent-copper)' }}
            >
              ＋
            </button>
          </div>
          {documents.map((doc, i) => (
            <div key={i} className="session-item" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '10px', opacity: 0.4 }}>ASSET //</span>
                <span className="session-item-text" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</span>
              </div>
              <button
                 className="item-actions"
                 onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.name); }}
                 style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0, transition: 'opacity 0.2s' }}
                 title="Remove Asset"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <AgentStatus activeTools={activeTools} />
        <div className="sidebar-user" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="user-avatar" style={{ 
            width: '24px', height: '24px', background: 'var(--bg-elevated)', 
            border: '1px solid var(--border-subtle)', borderRadius: '2px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' 
          }}>
            {activeTools.length > 0 ? '●' : '○'}
          </div>
          <div className="user-info">
            <div className="user-name" style={{ fontSize: '11px', fontWeight: 'bold' }}>USER_CHINMAY</div>
            <div className="user-plan" style={{ fontSize: '9px', color: 'var(--accent-copper)', fontFamily: 'var(--font-mono)' }}>PRO_LICENSE</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
