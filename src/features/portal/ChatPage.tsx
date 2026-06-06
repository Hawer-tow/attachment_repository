import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';

type Msg = { from: 'user' | 'bot'; text: string };

const KEYWORDS: { match: RegExp; reply: string }[] = [
  { match: /\b(extra|more)\b.*\btowel/, reply: "I've sent a request for extra towels to housekeeping — they'll be at your room in about 10 minutes." },
  { match: /\btowel/,            reply: "Sure thing. I'll request fresh towels be delivered to your room." },
  { match: /\b(check[ -]?in|checkin)\b/, reply: 'You can complete online check-in at /portal/check-in. Need me to walk you through it?' },
  { match: /\b(check[ -]?out|checkout)\b/, reply: 'Standard checkout is 11am. Need a late checkout? I can request one (subject to availability).' },
  { match: /\b(wifi|wi-fi|internet)\b/, reply: 'Network: StaySync-Guest · Password: Welcome2026. Need help connecting a device?' },
  { match: /\b(breakfast|food|eat|menu|hungry)\b/, reply: "Breakfast runs 6:30am-10:30am. You can order room service from /portal/room-service." },
  { match: /\b(taxi|cab|airport|transfer)\b/, reply: 'I can arrange a taxi or airport transfer. Open /portal/concierge and pick the option you need.' },
  { match: /\b(laundry|wash|clothes)\b/, reply: "Same-day laundry is available. Use the Laundry option in /portal/concierge." },
  { match: /\b(wake[ -]?up|alarm)\b/, reply: "I can schedule a wake-up call. Just tell me the time." },
  { match: /\b(tour|safari|trip)\b/, reply: 'We offer city tours, day trips, and safaris. Open /portal/concierge to browse options.' },
  { match: /\b(pool|gym|spa)\b/, reply: 'Pool: 6am-10pm · Gym: 24/7 · Spa: 9am-9pm. Want me to book a spa slot?' },
  { match: /\b(thank|thanks)\b/, reply: "You're very welcome! Anything else I can help with?" },
];

function replyFor(input: string): string {
  const text = input.toLowerCase();
  for (const k of KEYWORDS) {
    if (k.match.test(text)) return k.reply;
  }
  return "I'm not sure I understood that. I can help with towels, check-in, checkout, Wi-Fi, breakfast, taxi, laundry, wake-up calls, tours, and pool/gym/spa hours. For anything else, please use the concierge form.";
}

const SUGGESTIONS = [
  'Extra towels please',
  'What time is breakfast?',
  'Wi-Fi password',
  'Book a taxi to the airport',
];

export default function PortalChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: "Hi! I'm the StaySync help desk. I can answer common questions about your stay — towels, check-in, checkout, Wi-Fi, and more. For anything else, the concierge team is one click away." },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    setMessages((m) => [...m, { from: 'user', text: value }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'bot', text: replyFor(value) }]);
    }, 600);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Quick answers</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Guest Help Chat</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Common questions about your stay, services, and the hotel. For complex requests, use the concierge form.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/14 bg-white/95 text-slate-900 shadow-xl">
        <div className="h-[420px] space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.from === 'bot' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.text}
              </div>
              {m.from === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-cyan-300 hover:text-cyan-700">{s}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…"
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
            <button type="submit" className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
