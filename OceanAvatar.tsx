import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { api } from './api';

type Msg = { role: 'user' | 'assistant'; content: string };

const PAGE_CONTEXTS: Record<string, string> = {
  '/': 'The guest is on the home page viewing the property overview.',
  '/book': 'The guest is on the booking page. Help with dates, pricing, and availability.',
  '/availability': 'The guest is checking availability. Help with dates and pricing.',
  '/flights': 'The guest is on the flights page. Nearest airports: PNS (Pensacola, 45 min), VPS (Destin, 1 hr), MOB (Mobile, 1 hr).',
  '/gallery': 'The guest is viewing the photo gallery. Describe the Gulf-front balcony, primary suite, open living room, and full kitchen.',
  '/amenities': 'The guest is on the amenities page. Highlight the pool, hot tub, gym, beach access, covered parking, full kitchen, washer/dryer.',
  '/faq': 'The guest is reading the FAQ. Check-in 4 PM, checkout 10 AM, no pets, no parties, parking $55/vehicle, min age 25.',
  '/reviews': 'The guest is reading reviews — 4.9-star average, praised for views and cleanliness.',
  '/about': 'The guest is on the about page learning about Coastal Haven and booking direct.',
  '/contact': 'The guest is on the contact page. Encourage them to reach out.',
  '/cancellation-policy': 'Full refund >30 days, 50% up to 14 days, non-refundable within 14 days.',
  '/house-rules': 'No smoking, no pets, no parties, quiet hours 10 PM–8 AM, primary renter must be 25+.',
  '/orange-beach-condo': '3 bedrooms, 2 bathrooms, 4 beds, sleeps 10, 14th floor, Gulf-front Unit 1408.',
  '/orange-beach-guide': 'Local guide: LuLu\'s, The Gulf, Cobalt for dining; dolphin cruises, parasailing, Gulf State Park nearby.',
  '/things-to-do-orange-beach': 'The guest is exploring activities near Unit 1408.',
  '/orange-beach-restaurants': 'The guest is looking for restaurant picks near Orange Beach.',
  '/orange-beach-beaches': 'The guest is reading about nearby beaches and beach access.',
  '/family-activities-orange-beach': 'The guest is looking for family-friendly activities near Unit 1408.',
};

function getPageCtx(path: string) {
  return PAGE_CONTEXTS[path] ?? 'The guest is browsing the Coastal Haven Unit 1408 website at Phoenix V.';
}

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

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const canListen = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const setMuted = (v: boolean) => { mutedRef.current = v; _setMuted(v); };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!open && canSpeak) window.speechSynthesis.cancel();
  }, [open, canSpeak]);

  const speak = (text: string) => {
    if (!canSpeak || mutedRef.current) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const vlist = window.speechSynthesis.getVoices();
    const pick = vlist.find(v => v.lang.startsWith('en') && /samantha|victoria|karen|moira|tessa|zira|fiona/i.test(v.name))
      ?? vlist.find(v => v.lang.startsWith('en-US'))
      ?? vlist.find(v => v.lang.startsWith('en'))
      ?? vlist[0];
    if (pick) utt.voice = pick;
    utt.rate = 0.92; utt.pitch = 1.05;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
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
                <button className="ocean-icon-btn" onClick={() => { setMuted(!muted); if (!muted && canSpeak) window.speechSynthesis.cancel(); }} title={muted ? 'Unmute' : 'Mute'}>
                  {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              )}
              <button className="ocean-icon-btn" onClick={() => setOpen(false)} title="Close">
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
                  <button key={s} className="ocean-pill" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="ocean-input-row">
            {canListen && (
              <button
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
