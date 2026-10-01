import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, RefreshCw, User } from 'lucide-react';
import { askGeminiWithRAG } from '../utils/ragEngine';
import '../index.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '👋 Hello! I am the **GridShift AI Copilot** powered by Google Gemini and real-time municipal telemetry. How can I assist you with waste surges, construction debris, or fleet dispatches today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    '🏗️ Status of construction debris?',
    '🤖 Where is Rover R-1 patrolling?',
    '📸 How to report illegal dumping?',
    '⚡ Active surge hotspot status?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await askGeminiWithRAG(textToSend);
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: '⚠️ Apologies, I encountered an issue retrieving real-time telemetry. Please try again shortly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-trigger-btn pulse-dot"
          aria-label="Open AI Copilot Chat"
        >
          <div style={{ position: 'relative' }}>
            <Bot size={20} color="#22c55e" />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.02em' }}>
            AI Copilot
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px -15px rgba(9, 44, 94, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#092C5E',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={20} color="#22c55e" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>GridShift Copilot</h3>
                  <span style={{ fontSize: '9px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    RAG
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd' }}>
                  Gemini 2.5 • Real-Time Municipal Telemetry
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Close Chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none'
            }}
          >
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#092C5E',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isUser ? '#092C5E' : '#e2e8f0',
                      color: isUser ? 'white' : '#092C5E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '12px',
                      marginTop: '4px'
                    }}
                  >
                    {isUser ? <User size={14} /> : <Bot size={14} color="#16a34a" />}
                  </div>

                  <div
                    style={{
                      maxWidth: '82%',
                      backgroundColor: isUser ? '#092C5E' : 'white',
                      color: isUser ? 'white' : '#1e293b',
                      padding: '12px 14px',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.text}
                    <div
                      style={{
                        fontSize: '9px',
                        color: isUser ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                        marginTop: '4px',
                        textAlign: isUser ? 'right' : 'left'
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', padding: '8px' }}>
                <RefreshCw size={14} className="pulse-dot" color="#22c55e" />
                <span>GridShift RAG synthesizing answer...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'white',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask about construction debris, fleet, or permits..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '9999px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#092C5E',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
                flexShrink: 0
              }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
