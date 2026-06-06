import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Award, Crown, Gift, Loader2, Phone, Search, Sparkles, Star, Trophy } from 'lucide-react';

type Tier = { name: string; from: number };
type HistoryRow = {
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  room_number?: string;
  total_price: number;
  status: string;
};

type LoyaltyResponse = {
  guest: { first_name: string; last_name: string; loyalty_tier: string | null };
  points: number;
  stays: number;
  tier: string;
  next_tier: Tier | null;
  history: HistoryRow[];
};

const TIERS: { name: string; from: number; color: string; Icon: typeof Star; perks: string[] }[] = [
  { name: 'Silver',   from: 0,     color: 'from-slate-400 to-slate-600',       Icon: Star,    perks: ['10% off food', 'Late checkout (1pm)'] },
  { name: 'Gold',     from: 5000,  color: 'from-amber-400 to-yellow-600',      Icon: Award,   perks: ['Free breakfast', 'Free Wi-Fi upgrade', '15% off room rate'] },
  { name: 'Platinum', from: 20000, color: 'from-cyan-400 to-blue-700',         Icon: Trophy,  perks: ['Lounge access', 'Free airport transfer', 'Welcome gift'] },
  { name: 'Diamond',  from: 50000, color: 'from-violet-400 to-fuchsia-700',    Icon: Crown,   perks: ['Suite upgrades', 'Personal concierge', 'Exclusive events'] },
];

const REWARDS = [
  { title: 'Free night',         cost: 8000,  desc: 'Redeem one complimentary night at any property.' },
  { title: 'Spa day',            cost: 4500,  desc: 'A full day of spa treatments and pool access.' },
  { title: 'Dinner for two',     cost: 3200,  desc: 'A 3-course meal for two at our signature restaurant.' },
  { title: 'Airport fast-track', cost: 1500,  desc: 'Priority security and lounge access at the airport.' },
  { title: 'Late checkout',      cost: 500,   desc: 'Stay until 6pm on departure day.' },
  { title: 'Welcome champagne',  cost: 1200,  desc: 'A bottle of sparkling wine on arrival.' },
];

export default function PortalLoyaltyPage() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const { lookupPortalLoyalty } = await import('@/lib/portalApi');
      const res = await lookupPortalLoyalty(phone.trim());
      setData(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'No profile found for that phone number.');
    } finally {
      setLoading(false);
    }
  }

  const current = data ? (TIERS.find((t) => t.name === data.tier) ?? TIERS[0]) : null;
  const next = data?.next_tier ?? null;
  const progress = data && current && next
    ? Math.min(100, Math.round(((data.points - current.from) / (next.from - current.from)) * 100))
    : data ? 100 : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">StaySync Rewards</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Loyalty Program</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Enter your phone number to see your tier, points, and available rewards.</p>
      </header>

      <form onSubmit={lookup} className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Find your profile</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_auto]">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Phone number</span>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2547XX XXX XXX"
                aria-label="Phone number"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="mt-[22px] inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Looking up…' : 'Look up'}
          </button>
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </form>

      <AnimatePresence>
        {data && current && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Welcome back, {data.guest.first_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${current.color} text-white`}>
                      <current.Icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">{current.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{data.stays} completed stay{data.stays === 1 ? '' : 's'} on file</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Points balance</p>
                  <p className="mt-1 text-3xl font-bold text-cyan-700">{data.points.toLocaleString()}</p>
                </div>
              </div>
              {next && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{current.name}</span><span>{next.name} at {next.from.toLocaleString()} pts</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{(next.from - data.points).toLocaleString()} points to {next.name}</p>
                </div>
              )}
            </div>

            {data.history.length > 0 && (
              <div className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Recent stays</h2>
                <ul className="divide-y divide-slate-100">
                  {data.history.map((h) => (
                    <li key={h.booking_reference} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <div>
                        <p className="font-mono text-xs text-slate-500">{h.booking_reference}</p>
                        <p className="text-xs text-slate-600">
                          {h.check_in_date} → {h.check_out_date} · Room {h.room_number ?? '—'}
                        </p>
                      </div>
                      <p className="font-bold text-cyan-700">KES {Math.round(h.total_price).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-cyan-100/80">All tiers</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border p-4 ${data && t.name === data.tier ? 'border-cyan-300 bg-cyan-50' : 'border-white/14 bg-white/95'} text-slate-900 shadow-xl`}
            >
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${t.color} text-white`}>
                <t.Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-sm font-bold">{t.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">From {t.from.toLocaleString()} pts</p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                {t.perks.map((p) => <li key={p}>· {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-cyan-100/80">Available rewards</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REWARDS.map((r) => (
            <div key={r.title} className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-xl">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-cyan-600" />
                <p className="text-sm font-bold">{r.title}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{r.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-bold text-cyan-700">{r.cost.toLocaleString()} pts</p>
                <button
                  disabled={!data || data.points < r.cost}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Redeem
                </button>
              </div>
            </div>
          ))}
        </div>
        {!data && (
          <p className="mt-3 text-center text-xs text-cyan-100/60">Look up your profile above to redeem rewards.</p>
        )}
      </section>
    </div>
  );
}
