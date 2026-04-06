'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function KnowledgeGraph({ graphData, onNodeClick }) {
  const fgRef = useRef();
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [hoverNode, setHoverNode] = useState(null);

  useEffect(() => {
    // Handle resizing on client side
    setWindowSize({
      width: window.innerWidth - 300, // accommodate sidebar/panels
      height: window.innerHeight - 80 // accommodate header
    });
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth - 300,
        height: window.innerHeight - 80
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeClick = useCallback(node => {
    if (!fgRef.current || !node) return;
    // Center logic
    fgRef.current.centerAt(node.x, node.y, 1000);
    fgRef.current.zoom(2, 2000);
    if (onNodeClick) onNodeClick(node);
  }, [onNodeClick]);

  if (!graphData) return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading graph...</div>;

  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden', height: '100%', width: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        width={windowSize.width}
        height={windowSize.height}
        graphData={graphData}
        nodeLabel="label"
        nodeColor={node => {
          if (hoverNode && hoverNode.id === node.id) return '#fff';
          return graphData.domain_colors[node.domain] || '#999';
        }}
        nodeRelSize={6}
        linkColor={() => 'rgba(255, 255, 255, 0.15)'}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        onNodeHover={node => setHoverNode(node)}
        onNodeClick={handleNodeClick}
        d3VelocityDecay={0.3}
        // Custom rendering to put text near nodes
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 6, bckgDimensions[0], bckgDimensions[1]);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = hoverNode && hoverNode.id === node.id ? '#fff' : 'rgba(255, 255, 255, 0.8)';
          ctx.fillText(label, node.x, node.y + 6 + bckgDimensions[1]/2);
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = graphData.domain_colors ? (graphData.domain_colors[node.domain] || '#999') : '#999';
          ctx.fill();
        }}
      />
    </div>
  );
}
