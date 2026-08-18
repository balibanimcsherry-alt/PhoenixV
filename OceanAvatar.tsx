import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { api } from './api';

type Msg = { role: 'user' | 'assistant'; content: string };

// Animated avatar face — SVG-based
function AvatarFace({ speaking, size = 56 }: { speaking: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="28" cy="31" r="23" fill="#0d5f6b" />
      {/* Highlight */}
      <circle cx="22" cy="23" r="9" fill="#1a7585" opacity="0.35" />
      {/* Wave hair */}
      <path d="M5 22 Q11 12 18 20 Q24 28 28 16 Q32 4 40 16 Q46 26 51 18"
        stroke="#6baeb6" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      {/* Left eye */}
      <ellipse cx="20" cy="29" rx="5" ry="5.5" fill="white" />
      <circle cx="21.5" cy="30" r="2.8" fill="#072a30" />
      <circle cx="22.5" cy="28.5" r="1.1" fill="white" />
      {/* Right eye */}
      <ellipse cx="36" cy="29" rx="5" ry="5.5" fill="white" />
      <circle cx="37.5" cy="30" r="2.8" fill="#072a30" />
      <circle cx="38.5" cy="28.5" r="1.1" fill="white" />
      {/* Mouth */}
      {speaking
        ? <ellipse cx="28" cy="41.5" rx="5" ry="3.5" fill="#072a30" />
        : <path d="M22 40 Q28 45.5 34 40" stroke="#072a30" strokeWidth="2.3" strokeLinecap="round" fill="none" />
      }
      {/* Cheeks */}
      <circle cx="13.5" cy="35" r="3.5" fill="#d98871" opacity="0.32" />
      <circle cx="42.5" cy="35" r="3.5" fill="#d98871" opacity="0.32" />
    </svg>
  );
}

const SUGGESTIONS = [
  'Tell me about Unit 1408',
  "What's included with the stay?",
  'How do I get to Orange Beach?',
  'What amenities are available?',
];

const GREETING = "Hi! I'm Cove 🌊 Your personal concierge for Coastal Haven, Unit 1408 at Phoenix V in Orange Beach. What can I help you with today?";

export default function OceanAvatar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const mutedRef = useRef(false);
  const [muted, _setMuted] = useState(false);
  const recRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const canListen = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const setMuted = (v: boolean) => { mutedRef.current = v; _setMuted(v); };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Cancel TTS and mic when panel closes
  useEffect(() => {
    if (!open) {
      if (canSpeak) window.speechSynthesis.cancel();
      setSpeaking(false);
      if (recRef.current) { recRef.current.stop(); setListening(false); }
    }
  }, [open, canSpeak]);

  // Escape key closes panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const speak = (text: string) => {
    if (!canSpeak || mutedRef.current) return;
    window.speechSynthesis.cancel();
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    const utt = new SpeechSynthesisUtterance(text);
    const vlist = window.speechSynthesis.getVoices();
    const pick = vlist.find(v => v.lang.startsWith('en') && /samantha|victoria|karen|moira|tessa|zira|fiona/i.test(v.name))
      ?? vlist.find(v => v.lang.startsWith('en-US'))
      ?? vlist.find(v => v.lang.startsWith('en'))
      ?? vlist[0];
    if (pick) utt.voice = pick;
    utt.rate = 0.92; utt.pitch = 1.05;
    utt.onstart = () => {
      setSpeaking(true);
      // Safety: reset speaking state if onend never fires (no-audio environments)
      speakTimerRef.current = setTimeout(() => setSpeaking(false), Math.max(text.length * 80, 3000));
    };
    utt.onend = () => { if (speakTimerRef.current) clearTimeout(speakTimerRef.current); setSpeaking(false); };
    utt.onerror = () => { if (speakTimerRef.current) clearTimeout(speakTimerRef.current); setSpeaking(false); };
    window.speechSynthesis.speak(utt);
  };

  // Greeting on first open
  useEffect(() => {
    if (!open || messages.length > 0) return;
    setMessages([{ role: 'assistant', content: GREETING }]);
    setTimeout(() => speak(GREETING), 250);
  }, [open]); // eslint-disable-line

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const history: Msg[] = [...messages, { role: 'user', content: t }];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const r = await api<{ reply: string }>('/api/chat/ai', {
        method: 'POST',
        body: JSON.stringify({ messages: history.slice(-12), page: pathname }),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: r.reply }]);
      speak(r.reply);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Having a moment — please try again or use the contact form!" }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (!canListen) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    if (canSpeak) window.speechSynthesis.cancel();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        className={`ocean-fab${speaking ? ' ocean-fab--speaking' : ''}${open ? ' ocean-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Chat with Cove"
      >
        <span className="ocean-fab-ring ocean-fab-ring--1" />
        <span className="ocean-fab-ring ocean-fab-ring--2" />
        <div className="ocean-fab-face">
          <AvatarFace speaking={speaking} size={44} />
        </div>
        {!open && <span className="ocean-fab-label">Ask Cove</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ocean-panel">
          {/* Header */}
          <div className="ocean-panel-header">
            <div className={`ocean-panel-avatar ${speaking ? 'avatar-speaking' : 'avatar-idle'}`}>
              <AvatarFace speaking={speaking} size={50} />
              <span className="av-bubble av-bubble--1" />
              <span className="av-bubble av-bubble--2" />
              <span className="av-bubble av-bubble--3" />
            </div>
            <div className="ocean-panel-info">
              <div className="ocean-panel-name">Cove</div>
              <div className="ocean-panel-status">
                {listening ? '🎤 Listening…'
                  : speaking ? '🌊 Speaking…'
                  : loading ? '💭 Thinking…'
                  : 'Unit 1408 · Phoenix V'}
              </div>
            </div>
            <div className="ocean-panel-actions">
              {canSpeak && (
                <button
                  type="button"
                  className="ocean-icon-btn"
                  onClick={() => { setMuted(!muted); if (!muted && canSpeak) window.speechSynthesis.cancel(); }}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              )}
              <button type="button" className="ocean-icon-btn" onClick={() => setOpen(false)} title="Close">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ocean-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ocean-bubble ocean-bubble--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="ocean-bubble-icon">
                    <AvatarFace speaking={false} size={22} />
                  </div>
                )}
                <div className="ocean-bubble-text">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="ocean-bubble ocean-bubble--assistant">
                <div className="ocean-bubble-icon"><AvatarFace speaking={false} size={22} /></div>
                <div className="chat-typing"><span /><span /><span /></div>
              </div>
            )}
            {messages.length <= 1 && !loading && (
              <div className="ocean-suggestions">
                {SUGGESTIONS.map(s => (
                  <button type="button" key={s} className="ocean-pill" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="ocean-input-row">
            {canListen && (
              <button
                type="button"
                className={`ocean-mic-btn${listening ? ' ocean-mic-btn--on' : ''}`}
                onClick={toggleMic}
                title={listening ? 'Stop listening' : 'Speak your question'}
              >
                {listening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            )}
            <input
              placeholder="Ask anything about Unit 1408…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              disabled={loading}
            />
            <button
              type="button"
              className="ocean-send-btn"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
