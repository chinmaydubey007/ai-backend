'use client';
import { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import MermaidDiagram from '../components/MermaidDiagram';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LabPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [targetSpecs, setTargetSpecs] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState('');
  
  // Dummy props for sidebar
  const [sessions] = useState([]);
  const [documents] = useState([]);
  const [activeTools, setActiveTools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const resultRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!productName || !description) return;
    
    setIsAnalyzing(true);
    setResult('');
    setActiveTools(['Thinking...']);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/lab/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productName, description, constraints, target_specs: targetSpecs })
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep incomplete chunk

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.done) {
              setActiveTools([]);
              break;
            }
            if (data.token) {
              setResult(prev => prev + data.token);
            }
            if (data.tool_used) {
              setActiveTools(prev => [...prev.filter(t => t !== 'Thinking...'), data.tool_used]);
              setTimeout(() => {
                 setActiveTools(prev => prev.filter(t => t !== data.tool_used));
              }, 4000);
            }
          } catch (e) { }
        }
      }
    } catch (e) {
      setResult('Failed to analyze product: ' + e);
      setActiveTools([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeSessionId={null}
        onSelectSession={() => {}}
        onNewChat={() => {}}
        onDeleteSession={() => {}}
        activeTools={activeTools}
      />

      <main className="main-content">
        <Header 
          isSidebarOpen={sidebarOpen} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => {}}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={false}
          sessionTitle="DESIGN LAB"
        />

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Form Area */}
          <div style={{ 
            width: '450px', padding: '32px', borderRight: '1px solid var(--border-subtle)',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', fontFamily: 'var(--font-mono)' }}>PRODUCT BRIEF</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Describe the hardware you want to build. SiliconMind will architect the system.
            </p>

            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Product Name *</label>
                <input 
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Battery-powered BLE Logger"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Core Functionality *</label>
                <textarea 
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Logs temperature every hour and transmits via BLE when connected."
                  style={{ width: '100%', padding: '10px', minHeight: '100px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Constraints (Optional)</label>
                <input 
                  value={constraints}
                  onChange={e => setConstraints(e.target.value)}
                  placeholder="Under $10 BOM, coin cell battery"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Specs (Optional)</label>
                <input 
                  value={targetSpecs}
                  onChange={e => setTargetSpecs(e.target.value)}
                  placeholder="1-year battery life, ±0.5°C accuracy"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isAnalyzing}
                style={{ 
                  marginTop: '16px', padding: '12px', background: 'var(--accent-copper)', color: '#000', 
                  border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isAnalyzing ? 'wait' : 'pointer' 
                }}
              >
                {isAnalyzing ? 'Architecting System...' : 'GENERATE IMPLEMENTATION PLAN'}
              </button>
            </form>
          </div>

          {/* Right panel: Output */}
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-surface)' }}>
            {!result && !isAnalyzing ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/>
                </svg>
                <p>Submit a product brief to generate a system architecture.</p>
              </div>
            ) : (
              <div ref={resultRef} className="message ai" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      if (!inline && match && match[1] === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                      }
                      return <code className={className} {...props}>{children}</code>
                    }
                  }}
                >
                  {result}
                </ReactMarkdown>
                {isAnalyzing && <span className="typing-cursor">▋</span>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
