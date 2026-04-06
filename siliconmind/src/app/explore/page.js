'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReactMarkdown from 'react-markdown';

// force-graph must be dynamically imported with no ssr because it relies on canvas and window
const KnowledgeGraphNoSSR = dynamic(() => import('../components/KnowledgeGraph'), {
  ssr: false,
  loading: () => <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Initializing Graph Engine...</div>
});

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function ExplorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy props for sidebar since explore doesn't manage sessions natively
  const [sessions] = useState([]);
  const [documents] = useState([]);
  const [activeTools] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/v1/knowledge/graph`)
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(console.error);
  }, []);

  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    setNodeDetails(null);
    setAiExplanation('');
    
    // Fetch details
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/knowledge/node/${node.id}`);
      const data = await res.json();
      setNodeDetails(data);
    } catch (e) {
      console.error(e);
    }
  };

  const explainConcept = async (mode = 'implementation') => {
    if (!selectedNode) return;
    setIsExplaining(true);
    setAiExplanation('');
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/knowledge/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: selectedNode.id, mode })
      });
      const data = await res.json();
      setAiExplanation(data.explanation);
    } catch (e) {
      setAiExplanation('Failed to fetch explanation: ' + e);
    } finally {
      setIsExplaining(false);
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
          sessionTitle="KNOWLEDGE EXPLORER"
        />

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Graph Engine Area */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <KnowledgeGraphNoSSR graphData={graphData} onNodeClick={handleNodeClick} />
            </div>
          </div>

          {/* Right Panel for Info & AI Explanation */}
          {selectedNode && (
            <div style={{ 
              width: '400px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)',
              padding: '24px', overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  background: nodeDetails?.domain_color || 'var(--accent-copper)', 
                  color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                }}>
                  {nodeDetails?.domain_label || selectedNode.domain.toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>{selectedNode.label}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>{selectedNode.desc}</p>

              {nodeDetails && (
                <>
                  {nodeDetails.prerequisites.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>REQUIRES KNOWLEDGE OF:</h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {nodeDetails.prerequisites.map(p => (
                          <span key={p.id} style={{ fontSize: '12px', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {nodeDetails.leads_to.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>LEADS TO:</h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {nodeDetails.leads_to.map(l => (
                          <span key={l.id} style={{ fontSize: '12px', border: '1px dashed var(--border-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                            {l.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <hr style={{ borderColor: 'var(--border-subtle)', margin: '24px 0' }} />

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => explainConcept('implementation')}
                      disabled={isExplaining}
                      className="primary-button"
                      style={{ flex: 1, padding: '10px', fontSize: '12px', background: 'var(--accent-copper)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {isExplaining ? 'Thinking...' : 'AI → How is this used?'}
                    </button>
                    <button 
                      onClick={() => explainConcept('theory')}
                      disabled={isExplaining}
                      className="secondary-button"
                      style={{ flex: 1, padding: '10px', fontSize: '12px', background: 'transparent', color: 'var(--accent-copper)', border: '1px solid var(--accent-copper)', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Explain Theory
                    </button>
                  </div>

                  {aiExplanation && (
                    <div className="message ai" style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                      <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
