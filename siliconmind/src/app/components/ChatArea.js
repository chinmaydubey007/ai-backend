'use client';
import { useEffect, useRef, forwardRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import MermaidDiagram from './MermaidDiagram';

const ChatArea = forwardRef(function ChatArea({ messages, isTyping, isStreaming }, ref) {
  const scrollRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const renderContent = (text, isCurrStreaming) => {
    if (!text) return null;

    let thinkContent = null;
    let mainContent = text;

    if (text.includes('<think>')) {
      const parts = text.split('<think>');
      const afterThink = parts[1];
      if (afterThink.includes('</think>')) {
        const thinkParts = afterThink.split('</think>');
        thinkContent = thinkParts[0];
        mainContent = parts[0] + thinkParts[1];
      } else {
        // Still streaming the thinking block
        thinkContent = afterThink;
        mainContent = parts[0]; 
      }
    }

    return (
      <div className="message-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {thinkContent && (
          <details 
            className="think-block"
            open={isCurrStreaming} 
            style={{
              background: 'var(--bg-surface)',
              borderLeft: '2px solid var(--border-subtle)',
              padding: '12px',
              borderRadius: '0 8px 8px 0',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--accent-copper)', fontFamily: 'var(--font-mono)', outline: 'none' }}>
              🧠 Thought Process
            </summary>
            <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', lineHeight: '1.4' }}>
              {thinkContent.trim() || 'Thinking...'}
            </div>
          </details>
        )}
        
        {mainContent.trim() && (
          <div className="markdown-body" style={{ lineHeight: '1.6', fontSize: '13px' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';
                  if (!inline && lang === 'mermaid') {
                    return <MermaidDiagram chart={String(children).replace(/\n$/, '')} isStreaming={isCurrStreaming} />;
                  }
                  return !inline ? (
                    <pre style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '16px', borderRadius: '4px', overflowX: 'auto', margin: '12px 0' }}>
                      <code className={className} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#e2e8f0' }} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code {...props} className={className} style={{ background: 'rgba(212, 163, 115, 0.1)', color: 'var(--accent-copper)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {mainContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="chat-area" ref={scrollRef}>
        <div className="welcome-screen">
          <div style={{ color: 'var(--accent-copper)', fontSize: '10px', letterSpacing: '4px', fontWeight: 'bold' }}>SYSTEM // SILICONMIND PRO</div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '42px', margin: '24px 0', fontWeight: '700', letterSpacing: '-1px' }}>SILICONMIND</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto 40px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Multi-agent engineering swarm for hardware design and analysis. 
            Orchestrating specialized experts across circuit design, signal integrity, and firmware development.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', maxWidth: '640px', width: '100%', margin: '0 auto', border: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { title: 'SCHEMATIC_Ingest', desc: 'Process datasheet PDFs' },
              { title: 'PCM_CALCULATION', desc: 'Thermal & Power metrics' },
              { title: 'RTL_SENSING', desc: 'Verilog code optimization' },
              { title: 'FIRMWARE_REVIEW', desc: 'Secure boot & driver HAL' }
            ].map((task, i) => {
              return (
                <div key={i} style={{ background: 'var(--bg-primary)', padding: '24px', textAlign: 'left' }}>
                  <div style={{ color: 'var(--accent-copper)', fontSize: '11px', fontWeight: 'bold' }}>[{task.title}]</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{task.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area" ref={scrollRef}>
      <div className="chat-container">
        {messages.map((msg, index) => {
          // Logic to subdue repetitive log headers: only show if the role changed from the previous message
          const showHeader = index === 0 || messages[index - 1].role !== msg.role;
          
          return (
            <div key={index} className={`message ${msg.role}`} style={{ marginBottom: showHeader ? '48px' : '24px', width: '100%' }}>
              <div className="message-body" style={{ 
                borderLeft: msg.role === 'ai' ? '1px solid var(--accent-copper)' : 'none', 
                paddingLeft: msg.role === 'ai' ? '24px' : '0',
                opacity: isStreaming && index === messages.length - 1 ? 0.9 : 1
              }}>
                {showHeader && (
                  <div style={{ fontSize: '11px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {msg.role === 'user' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span style={{ fontWeight: '600', fontSize: '12px' }}>You</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-copper)' }}>
                        <div style={{ width: '20px', height: '20px', background: 'var(--accent-copper-dim)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-copper)" strokeWidth="2">
                            <rect x="6" y="6" width="12" height="12" rx="1"/>
                            <path d="M6 9H3M6 12H3M6 15H3M18 9h3M18 12h3M18 15h3M9 6V3M12 6V3M15 6V3M9 18v3M12 18v3M15 18v3"/>
                          </svg>
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '12px' }}>SiliconMind</span>
                      </div>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{mounted ? new Date().toLocaleTimeString() : ''}</span>
                  </div>
                )}

                {msg.toolStatus && (
                  <div className="tool-status-badge" style={{ marginBottom: '16px' }}>
                    <span className="agent-icon-spin" style={{ display: 'inline-block', marginRight: '8px' }}>⚙️</span>
                    {msg.toolStatus.toUpperCase()}
                  </div>
                )}

                {renderContent(msg.content, isStreaming && index === messages.length - 1)}

                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {msg.citations.map((cite, i) => {
                      return (
                        <span key={i} style={{ 
                          fontSize: '10px', 
                          background: 'var(--bg-surface)', 
                          padding: '4px 8px', 
                          border: '1px solid var(--border-subtle)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)'
                        }}>
                          REF // {cite.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="message ai" style={{ marginBottom: '48px' }}>
            <div className="message-body" style={{ borderLeft: '1px solid var(--accent-copper)', paddingLeft: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-copper)', marginBottom: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: 'var(--accent-copper-dim)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-copper)" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="1"/>
                    <path d="M6 9H3M6 12H3M6 15H3M18 9h3M18 12h3M18 15h3M9 6V3M12 6V3M15 6V3M9 18v3M12 18v3M15 18v3"/>
                  </svg>
                </div>
                <span style={{ fontWeight: '600', fontSize: '12px' }}>SiliconMind is thinking...</span>
              </div>
              <div className="typing-indicator" style={{ marginTop: '16px' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatArea;
