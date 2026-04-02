'use client';

export default function AgentStatus({ activeTools = [] }) {
  const agents = [
    { id: 'embedded_c', name: 'Embedded C', icon: '📟', label: 'HAL & Bare Metal' },
    { id: 'rtos', name: 'FreeRTOS', icon: '📈', label: 'Concurrency & ISR' },
    { id: 'pcb', name: 'PCB Design', icon: '🔌', label: 'Signal Integrity' },
    { id: 'vlsi', name: 'VLSI / FPGA', icon: '🖇️', label: 'RTL & Logic' },
  ];

  const isAgentActive = (id) => {
    // Check if the current toolStatus contains the agent name or id
    return activeTools.some(tool => tool.toLowerCase().includes(id.replace('_', ' ')) || tool.toLowerCase().includes(id));
  };

  return (
    <div className="swarm-panel">
      <div className="swarm-panel-title">ORCHESTRATION_SWARM</div>
      {agents.map((agent) => (
        <div key={agent.id} className="agent-card" style={{ padding: '4px 8px' }}>
          <div className="agent-name" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            {agent.name.toUpperCase()}
          </div>
          <div className={`agent-led ${isAgentActive(agent.id) ? 'busy' : ''}`}></div>
        </div>
      ))}
    </div>
  );
}
