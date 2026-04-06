'use client';
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export default function MermaidDiagram({ chart, isStreaming }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#D4A373', // var(--accent-copper)
        primaryTextColor: '#fff',
        primaryBorderColor: '#A37A53',
        lineColor: '#6B7280',
        secondaryColor: '#121214',
        tertiaryColor: '#1E1E24'
      },
      fontFamily: 'var(--font-sans)',
      securityLevel: 'loose'
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;
      if (isStreaming) {
        // Clear SVG and do nothing else while streaming is happening to avoid crashing the parser
        if (isMounted) setSvgContent('');
        return;
      }
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (e) {
        console.error('Mermaid rendering failed', e);
        if (isMounted) {
          setSvgContent(`<div style="color:red; font-size:12px; font-family:monospace;">[MERMAID RENDERING ERROR]<br/>${e.message}</div>`);
        }
      }
    };
    renderDiagram();
    return () => { isMounted = false; };
  }, [chart, isStreaming]);

  return (
    <div 
      ref={containerRef}
      className="mermaid-container"
      style={{ 
        background: 'var(--bg-elevated)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        marginTop: '12px',
        marginBottom: '12px',
        overflowX: 'auto',
        textAlign: 'center'
      }}
    >
      {isStreaming ? (
        <div style={{ textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-copper)' }}>
          <div style={{ marginBottom: '8px', opacity: 0.8 }}>⚙️ GENERATING ARCHITECTURE GRAPH...</div>
          <pre style={{ margin: 0, opacity: 0.6 }}>{chart}</pre>
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: svgContent || '<div style="color:var(--text-muted); font-size:12px; font-family:monospace;">RENDERING SCHEMAS...</div>' }} />
      )}
    </div>
  );
}
