'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';
import SettingsModal from './components/SettingsModal';

const BACKEND_URL = 'http://localhost:8000';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsRefresh, setSessionsRefresh] = useState(0); 
  const [currActiveTools, setCurrActiveTools] = useState([]); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const chatAreaRef = useRef(null);

  // Load old messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/sessions/${activeSessionId}/messages`);
        const data = await res.json();
        // Backend returns citations as array of dicts. We map to the string format ChatArea expects.
        const formatted = data.messages.map(m => ({
          ...m,
          citations: m.citations ? m.citations.map(c => `${c.source} · Page ${c.page}`) : null
        }));
        setMessages(formatted);
      } catch (e) {
        console.error("Failed to load messages", e);
      }
    };
    loadMessages();
  }, [activeSessionId]);

  const handleSend = useCallback(async (text) => {
    // Add user message
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Call the SSE streaming endpoint
      const response = await fetch(`${BACKEND_URL}/api/v1/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: text, 
          max_tokens: 512,
          session_id: activeSessionId 
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Switch from "typing dots" to streaming mode
      setIsTyping(false);
      setIsStreaming(true);

      // Add an empty AI message that we'll fill progressively
      const aiMessageIndex = messages.length + 1; // +1 for the user message we just added
      setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by \n\n)
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep incomplete chunk in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6); // Remove "data: " prefix

          try {
            const data = JSON.parse(jsonStr);

            if (data.done) {
              // Stream complete
              setIsStreaming(false);
              break;
            }

            if (data.session_id && !activeSessionId) {
              // The backend created a new session and sent us the ID
              setActiveSessionId(data.session_id);
              setSessionsRefresh(prev => prev + 1); // Trigger sidebar to update
            }

            if (data.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'ai',
                  content: `⚠️ Error: ${data.error}`,
                };
                return updated;
              });
              setIsStreaming(false);
              break;
            }

            if (data.citations) {
              // Backend sent citation metadata — attach to the AI message
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...lastMsg,
                  citations: data.citations.map(c => `${c.source} · Page ${c.page}`),
                };
                return updated;
              });
            }

            if (data.token) {
              // Once tokens start arriving, the tools have finished their work
              setCurrActiveTools([]); 
              // Append the token to the last AI message
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content + data.token,
                };
                return updated;
              });
            }
            
            if (data.tool_used) {
              setCurrActiveTools([data.tool_used]);
              // Show an indicator that the swarm is being consulted
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...lastMsg,
                  toolStatus: data.tool_used,
                };
                return updated;
              });
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }

      setIsStreaming(false);
    } catch (error) {
      setIsTyping(false);
      setIsStreaming(false);
      // Show error as AI message
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `⚠️ Could not connect to backend. Make sure the FastAPI server is running on port 8000.\n\nError: ${error.message}`,
        },
      ]);
    }
  }, [messages.length]);

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/sessions/${id}`, { method: 'DELETE' });
      setSessionsRefresh(prev => prev + 1);
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(false)} 
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        refreshTrigger={sessionsRefresh}
        activeTools={currActiveTools}
      />
      <main className="main-content">
        <Header
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          sessionTitle={activeSessionId ? messages[0]?.content : null}
          onOpenSettings={() => setIsSettingsOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
        />
        <ChatArea
          messages={
            searchQuery.trim()
              ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
              : messages
          }
          isTyping={isTyping}
          isStreaming={isStreaming}
          ref={chatAreaRef}
        />
        <InputBar 
          onSend={handleSend} 
          disabled={isTyping || isStreaming} 
          onUpload={() => setSessionsRefresh(prev => prev + 1)}
        />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </main>
    </div>
  );
}
