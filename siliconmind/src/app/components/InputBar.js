'use client';
import { useState, useRef, useEffect } from 'react';

export default function InputBar({ onSend, onUpload, disabled = false }) {
  const [input, setInput] = useState('');
  const [tone, setTone] = useState('Standard');
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, tone);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are supported currently.');
      return;
    }

    setIsUploading(true);
    setUploadText(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('http://localhost:8000/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadText(`✅ Ingested ${file.name}`);
        if (onUpload) onUpload(); // Notify parent to refresh assets
      } else {
        setUploadText(`❌ Upload failed`);
      }
    } catch (err) {
      setUploadText(`❌ Connection error`);
    } finally {
      setTimeout(() => { setIsUploading(false); setUploadText(''); }, 3000);
      e.target.value = '';
    }
  };

  const handleVoiceClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (textareaRef.current) textareaRef.current.focus();
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="input-area" style={{ background: 'transparent', padding: '0 24px 24px' }}>
      <div className="input-wrapper" style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        opacity: disabled ? 0.7 : 1,
        transition: 'all var(--transition-fast)',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <textarea
          ref={textareaRef}
          style={{ 
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            padding: '16px 16px 8px',
            resize: 'none',
            minHeight: '24px',
            width: '100%'
          }}
          placeholder={isListening ? "Listening..." : "Ask about circuit design, firmware, VLSI..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf"
          onChange={handleFileChange}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 12px'
        }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button 
              onClick={handleAttachClick}
              disabled={disabled || isUploading}
              title="Attach File" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', color: isUploading ? 'var(--accent-copper)' : 'var(--text-muted)', fontSize: '12px', transition: 'all 0.15s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              {isUploading ? uploadText : 'Attach'}
            </button>
            <button 
              onClick={handleVoiceClick}
              disabled={disabled || isListening}
              title="Voice Input" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', color: isListening ? '#f44336' : 'var(--text-muted)', fontSize: '12px', transition: 'all 0.15s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isListening ? (
                  <circle cx="12" cy="12" r="6" fill="currentColor"/>
                ) : (
                  <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>
                )}
              </svg>
              {isListening ? 'Listening...' : 'Voice'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={disabled}
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Standard">Standard Output</option>
              <option value="Technical">Heavy Technical</option>
              <option value="Academic">Academic Paper</option>
              <option value="Creative">Creative Mentor</option>
            </select>
            <button 
              onClick={handleSubmit} 
              disabled={disabled}
              style={{ 
                background: input.trim() ? 'var(--accent-copper)' : 'var(--bg-elevated)', 
                color: input.trim() ? 'var(--text-inverse)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                padding: '8px 20px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.15s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="m22 2-10 10"/></svg>
              Send
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ 
        maxWidth: '900px', margin: '8px auto 0',
        fontSize: '10px', 
        color: 'var(--text-muted)', 
        textAlign: 'center'
      }}>
        SiliconMind Pro · Always verify critical hardware specifications independently.
      </div>
    </div>
  );
}
