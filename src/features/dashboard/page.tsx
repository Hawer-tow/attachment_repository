import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  BedDouble,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Hotel,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { useDashboardStore } from '@/app/store/dashboardStore';
import { searchAll, type SearchHit, type SearchResponse } from '@/lib/protectedEndpoints';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

const quickActions = [
  { label: 'Add Booking', to: '/bookings', icon: Plus, className: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Check In', to: '/bookings', icon: LogIn, className: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Check Out', to: '/bookings', icon: LogOut, className: 'bg-rose-600 hover:bg-rose-700' },
  { label: 'Assign Room', to: '/tape-chart', icon: BedDouble, className: 'bg-violet-600 hover:bg-violet-700' },
  { label: 'Invoice', to: '/reports', icon: FileText, className: 'bg-slate-700 hover:bg-slate-800' },
];

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      variants={fadeUp}
      className={cn('rounded-2xl border border-white/14 bg-white/92 p-5 text-slate-900 shadow-xl shadow-slate-950/10 backdrop-blur-xl', className)}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {icon && <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div>}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} className={cn('rounded-2xl p-4 text-white shadow-xl shadow-slate-950/15', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="rounded-xl bg-white/18 p-2">{icon}</div>
        <TrendingUp className="h-4 w-4 text-white/70" />
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-sm text-white/86">{label}</p>
      <p className="mt-2 text-xs text-white/70">{sub}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const stats = useDashboardStore((state) => state.stats);
  const arrivals = useDashboardStore((state) => state.arrivals);
  const dashboardError = useDashboardStore((state) => state.error);
  const fetchStats = useDashboardStore((state) => state.fetchStats);
  const fetchArrivals = useDashboardStore((state) => state.fetchArrivals);
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void fetchStats();
    void fetchArrivals();
  }, [fetchStats, fetchArrivals]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setSearching(false);
      searchAbortRef.current?.abort();
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = ctrl;
    const timer = window.setTimeout(async () => {
      try {
        const res = await searchAll(trimmed, 6);
        if (ctrl.signal.aborted) return;
        const payload = res.data;
        setSearchResults((payload as { data?: SearchResponse }).data ?? (payload as SearchResponse));
      } catch {
        if (!ctrl.signal.aborted) setSearchResults(null);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const trimmed = search.trim().toLowerCase();
  const filteredArrivals = useMemo(() => {
    if (!trimmed) return arrivals;
    return arrivals.filter((arrival) => {
      const guestName = [arrival.guest?.first_name, arrival.guest?.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const room = String(arrival.room?.room_number ?? '').toLowerCase();
      const reference = String(arrival.booking_reference ?? '').toLowerCase();
      return guestName.includes(trimmed) || room.includes(trimmed) || reference.includes(trimmed);
    });
  }, [arrivals, trimmed]);

  function pickHit(hit: SearchHit) {
    setSearchOpen(false);
    if (hit.type === 'guest') {
      navigate(`/guests?q=${encodeURIComponent(hit.label)}`);
    } else if (hit.type === 'booking') {
      navigate(`/bookings?q=${encodeURIComponent(hit.label)}`);
    } else if (hit.type === 'room') {
      navigate(`/tape-chart?q=${encodeURIComponent(hit.label)}`);
    }
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    // If the user typed a booking reference, jump straight to the bookings page
    // with the query in the URL so the bookings page can pre-fill its search.
    navigate(`/bookings?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen space-y-5 p-5 lg:p-6"
    >
      <motion.section
        variants={fadeUp}
        className="rounded-3xl border border-white/16 bg-slate-950/64 p-5 text-white shadow-2xl shadow-black/20 backdrop-blur-2xl"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-cyan-400/14 p-3 text-cyan-100 ring-1 ring-cyan-300/20">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-cyan-50/68">StaySync Hotel Management</p>
              <h2 className="mt-1 text-2xl font-bold">{greetingFor(now)}, {user?.name?.split(' ')[0] ?? 'Angela'}</h2>
              <p className="mt-1 text-sm text-cyan-50/70">Reception Dashboard - {formatDateTime(now)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div ref={searchWrapRef} className="relative min-w-64">
              <form onSubmit={handleSearchSubmit} role="search">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                <input
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search guest, room, booking..."
                  aria-label="Search guest, room, or booking"
                  className="h-10 w-full cursor-text rounded-2xl border border-white/15 bg-white/12 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-cyan-200/50 focus:bg-white/18"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setSearchResults(null); setSearchOpen(false); }}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white/70 transition hover:bg-white/30 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>
              <AnimatePresence>
                {searchOpen && search.trim().length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/95 p-2 text-slate-900 shadow-2xl backdrop-blur-xl"
                  >
                    {searching && !searchResults && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-cyan-100/80">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                      </div>
                    )}
                    {searchResults && searchResults.total === 0 && (
                      <p className="px-3 py-3 text-xs text-cyan-100/70">No matches for "{searchResults.query}".</p>
                    )}
                    {searchResults && (
                      <div className="space-y-1">
                        {searchResults.guests.length > 0 && (
                          <SearchGroup title="Guests" Icon={Users}>
                            {searchResults.guests.map((hit) => (
                              <SearchHitRow key={`g-${hit.id}`} hit={hit} onClick={() => pickHit(hit)} />
                            ))}
                          </SearchGroup>
                        )}
                        {searchResults.bookings.length > 0 && (
                          <SearchGroup title="Bookings" Icon={BookOpen}>
                            {searchResults.bookings.map((hit) => (
                              <SearchHitRow key={`b-${hit.id}`} hit={hit} onClick={() => pickHit(hit)} />
                            ))}
                          </SearchGroup>
                        )}
                        {searchResults.rooms.length > 0 && (
                          <SearchGroup title="Rooms" Icon={Building2}>
                            {searchResults.rooms.map((hit) => (
                              <SearchHitRow key={`r-${hit.id}`} hit={hit} onClick={() => pickHit(hit)} />
                            ))}
                          </SearchGroup>
                        )}
                        <div className="border-t border-white/10 px-2 pt-2">
                          <button
                            type="button"
                            onClick={(e) => { setSearchOpen(false); handleSearchSubmit(e as unknown as React.FormEvent<HTMLFormElement>); }}
                            className="w-full rounded-lg bg-cyan-500/15 px-3 py-2 text-left text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                          >
                            See all results in bookings →
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2">
              <UserCheck className="h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-xs text-white/60">Logged in as</p>
                <p className="text-sm font-semibold capitalize">{user?.role ?? 'receptionist'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {dashboardError && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
          {dashboardError}
        </motion.div>
      )}

      <motion.div variants={stagger} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Rooms Occupied" value={stats?.occupied_rooms ?? 0} sub={stats?.occupancy_rate ?? '0%'} icon={<BedDouble className="h-5 w-5" />} className="bg-gradient-to-br from-blue-600 to-indigo-700" />
        <KpiCard label="Available Rooms" value={stats?.available_rooms ?? 0} sub="Ready for booking" icon={<CheckCircle2 className="h-5 w-5" />} className="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <KpiCard label="Check-ins Today" value={stats?.checked_in_bookings ?? 0} sub="Guests arriving" icon={<LogIn className="h-5 w-5" />} className="bg-gradient-to-br from-cyan-500 to-blue-700" />
        <KpiCard label="Check-outs Today" value={stats?.checked_out_bookings ?? 0} sub="Guests leaving" icon={<LogOut className="h-5 w-5" />} className="bg-gradient-to-br from-rose-500 to-red-700" />
        <KpiCard label="Revenue Today" value={`KES ${(stats?.today_revenue ?? 0).toLocaleString()}`} sub="Front desk sales" icon={<Banknote className="h-5 w-5" />} className="bg-gradient-to-br from-amber-500 to-orange-700" />
        <KpiCard label="Pending Payments" value={stats?.pending_bookings ?? 0} sub="Unpaid bills" icon={<CreditCard className="h-5 w-5" />} className="bg-gradient-to-br from-slate-600 to-slate-900" />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2">
          <SectionTitle title="Operational Shortcuts" subtitle="Open dedicated pages for detailed work" icon={<CalendarDays className="h-4 w-4" />} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link to="/bookings" className="rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <LogIn className="mb-3 h-5 w-5 text-blue-600" />
              <p className="font-semibold text-slate-900">Bookings</p>
              <p className="mt-1 text-xs text-slate-500">Reservations, check-ins, check-outs, analytics, and recent bookings.</p>
            </Link>
            <Link to="/housekeeping" className="rounded-2xl border border-amber-100 bg-amber-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <Sparkles className="mb-3 h-5 w-5 text-amber-600" />
              <p className="font-semibold text-slate-900">Housekeeping</p>
              <p className="mt-1 text-xs text-slate-500">Cleaning queues, room readiness, staff assignment, and maintenance.</p>
            </Link>
            <Link to="/tape-chart" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <BedDouble className="mb-3 h-5 w-5 text-emerald-600" />
              <p className="font-semibold text-slate-900">Tape Chart</p>
              <p className="mt-1 text-xs text-slate-500">Room occupancy timeline and availability planning.</p>
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {quickActions.map(({ label, to, icon: Icon, className }) => (
                <Link key={label} to={to} className={cn('flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-white transition', className)}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle title="Notifications" subtitle="Front desk alerts" icon={<Bell className="h-4 w-4" />} />
          <div className="space-y-3">
            {(() => {
              const live = [
                stats?.pending_bookings
                  ? { id: 'pending', type: 'warning' as const, title: `${stats.pending_bookings} pending bookings`, message: 'Awaiting confirmation in the bookings page.', time: 'Now' }
                  : null,
                stats?.dirty_rooms
                  ? { id: 'dirty', type: 'warning' as const, title: `${stats.dirty_rooms} rooms need cleaning`, message: 'Housekeeping queue is filling up.', time: 'Now' }
                  : null,
                stats?.cancelled_bookings
                  ? { id: 'cancelled', type: 'info' as const, title: `${stats.cancelled_bookings} recent cancellations`, message: 'Review refund workflow.', time: 'Today' }
                  : null,
                stats && stats.total_rooms === 0
                  ? { id: 'empty', type: 'error' as const, title: 'No rooms in the system', message: 'Add rooms and room types from the admin panel.', time: 'Now' }
                  : null,
              ].filter(Boolean) as Array<{ id: string; type: 'error' | 'warning' | 'success' | 'info'; title: string; message: string; time: string }>;

              if (live.length === 0) {
                return <p className="text-sm text-slate-500">No front-desk alerts right now.</p>;
              }

              return live.map((notification) => (
                <div key={notification.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <AlertCircle className={cn('mt-0.5 h-4 w-4 shrink-0', notification.type === 'error' && 'text-red-500', notification.type === 'warning' && 'text-amber-500', notification.type === 'success' && 'text-emerald-500', notification.type === 'info' && 'text-blue-500')} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                    <p className="truncate text-xs text-slate-500">{notification.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{notification.time}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard>
          <SectionTitle title="Reservation Calendar" subtitle="Upcoming busy dates" icon={<CalendarDays className="h-4 w-4" />} />
          <div className="space-y-3">
            {(() => {
              const trends = stats?.monthly_booking_trends ?? [];
              if (trends.length === 0) {
                return <p className="text-sm text-slate-500">No booking trends yet.</p>;
              }
              return trends.map((row) => {
                const monthName = new Date(2026, (row.month || 1) - 1, 1).toLocaleString('en', { month: 'short' });
                return (
                  <div key={row.month} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">{monthName}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{row.total} bookings</p>
                      <p className="text-xs text-slate-500">Month {row.month}, 2026</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700">{row.total > 0 ? 'Active' : 'Quiet'}</span>
                  </div>
                );
              });
            })()}
          </div>
        </SectionCard>

        <SectionCard className="xl:col-span-2">
          <SectionTitle title="Today's Arrivals" subtitle="Guests expected at the property" icon={<LogIn className="h-4 w-4" />} />
          {trimmed && (
            <p className="mb-3 rounded-xl border border-cyan-200/40 bg-cyan-50/80 px-3 py-1.5 text-xs font-semibold text-cyan-800">
              Filtered by “{search.trim()}” — {filteredArrivals.length} of {arrivals.length} match
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {filteredArrivals.length === 0 ? (
              <p className="text-sm text-slate-500 md:col-span-3">
                {trimmed ? `No arrivals match “${search.trim()}”.` : 'No arrivals scheduled for today.'}
              </p>
            ) : (
              filteredArrivals.map((arrival) => {
                const guestName = [arrival.guest?.first_name, arrival.guest?.last_name].filter(Boolean).join(' ') || 'Guest';
                const inDate = String(arrival.check_in_date).slice(0, 10);
                const outDate = String(arrival.check_out_date).slice(0, 10);
                const nights = Math.max(1, Math.round((new Date(outDate).getTime() - new Date(inDate).getTime()) / 86_400_000));
                return (
                  <div key={arrival.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">{guestName}</p>
                    <p className="mt-1 text-xs text-slate-500">Room {arrival.room?.room_number ?? '—'} · {nights} night{nights > 1 ? 's' : ''}</p>
                    <p className="mt-3 text-sm font-bold text-blue-700">{arrival.booking_reference}</p>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}

function SearchGroup({ title, Icon, children }: { title: string; Icon: typeof Users; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100/60">
        <Icon className="h-3 w-3" /> {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SearchHitRow({ hit, onClick }: { hit: SearchHit; onClick: () => void }) {
  const badge =
    hit.type === 'guest'   ? { label: hit.stays ? `${hit.stays} stay${hit.stays === 1 ? '' : 's'}` : 'Guest', cls: 'bg-cyan-500/20 text-cyan-100' } :
    hit.type === 'booking' ? { label: hit.status?.replace('_', ' ') ?? 'Booking', cls: 'bg-violet-500/20 text-violet-100' } :
                             { label: hit.status ?? 'Room', cls: 'bg-emerald-500/20 text-emerald-100' };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/8"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{hit.label}</p>
        {hit.sub && <p className="truncate text-[11px] text-cyan-50/65">{hit.sub}</p>}
      </div>
      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', badge.cls)}>
        {badge.label}
      </span>
    </button>
  );
}
