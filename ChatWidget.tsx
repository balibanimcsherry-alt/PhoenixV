import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { track } from './analytics';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'What amenities are included?',
  'How far is it from the beach?',
  'What\'s the check-in time?',
  'Is parking included?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'contact'>('ai');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! I\'m Cove, your Coastal Haven concierge 🌊 Ask me anything about the condo, local area, or your stay!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sent, setSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleOpen = () => {
    if (!open) track('chat_open');
    setOpen(o => !o);
  };

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);
    try {
      const { reply } = await api<{ reply: string }>('/api/chat/ai', {
        method: 'POST',
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I\'m having trouble right now. Try the contact form!' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendContact = async () => {
    if (!contactMsg.trim()) return;
    await api('/api/chat/messages', { method: 'POST', body: JSON.stringify({ name, email, message: contactMsg }) });
    setSent(true);
  };

  return <>
    <button className="chat-fab" onClick={toggleOpen} aria-label="Chat">
      {open ? <X size={22} /> : <MessageCircle size={22} />}
      {!open && <span>Chat with us</span>}
    </button>

    {open && <div className="chat-panel ai-chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-avatar"><Bot size={18} /></div>
        <div>
          <div className="chat-panel-name">Cove · AI Concierge</div>
          <div className="chat-panel-sub">Coastal Haven • Typically replies instantly</div>
        </div>
        <div className="chat-mode-tabs">
          <button className={mode === 'ai' ? 'active' : ''} onClick={() => setMode('ai')}>AI Chat</button>
          <button className={mode === 'contact' ? 'active' : ''} onClick={() => setMode('contact')}>Contact</button>
        </div>
      </div>

      {mode === 'ai' ? <>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div className="chat-bubble-icon">
                {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="chat-bubble-text">{m.content}</div>
            </div>
          ))}
          {loading && <div className="chat-bubble assistant">
            <div className="chat-bubble-icon"><Bot size={14} /></div>
            <div className="chat-bubble-text chat-typing"><span /><span /><span /></div>
          </div>}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && <div className="chat-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="chat-suggestion-pill" onClick={() => send(s)}>{s}</button>
          ))}
        </div>}

        <div className="chat-input-row">
          <input
            placeholder="Ask anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button className="chat-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </> : <>
        {sent ? <div className="chat-sent">
          <div style={{ fontSize: 36 }}>✓</div>
          <p>Message sent! We'll reply to your email soon.</p>
        </div> : <div className="chat-contact-form">
          <p>Send us a message and we'll reply by email.</p>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <textarea placeholder="Your message…" rows={4} value={contactMsg} onChange={e => setContactMsg(e.target.value)} />
          <button className="btn wide" onClick={sendContact}><Send size={14} /> Send message</button>
        </div>}
      </>}
    </div>}
  </>;
}
