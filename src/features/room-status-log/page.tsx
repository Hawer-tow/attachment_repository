import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, BedDouble, Filter, History, Loader2, RefreshCw, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

type Status =
  | 'available' | 'occupied' | 'reserved' | 'dirty' | 'cleaning' | 'maintenance' | 'out_of_service'
  | string;

type LogRow = {
  id: number;
  room_id: number;
  old_status: Status | null;
  new_status: Status;
  changed_by: number | null;
  changed_at: string;
  room: { id: number; room_number: string; floor: number } | null;
  changedBy: { id: number; name: string } | null;
};

type Summary = Record<Status, number>;

const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  available:    { label: 'Available',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  occupied:     { label: 'Occupied',    bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500' },
  reserved:     { label: 'Reserved',    bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  dirty:        { label: 'Dirty',       bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  cleaning:     { label: 'Cleaning',    bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  maintenance:  { label: 'Maintenance', bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-500' },
  out_of_service: { label: 'Out of service', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

function meta(status: string | null) {
  if (!status) return { label: '—', bg: 'bg-slate-50', text: 'text-slate-400', dot: 'bg-slate-300' };
  return STATUS_META[status] ?? { label: status, bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
}

export default function RoomStatusLogPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ success: boolean; data: { logs: LogRow[]; summary: Summary } }>('/room-status-logs');
      setLogs(res.data.data.logs);
      setSummary(res.data.data.summary);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not load room status log.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((row) => {
      if (statusFilter !== 'all' && row.new_status !== statusFilter && row.old_status !== statusFilter) return false;
      if (!q) return true;
      const room = row.room?.room_number?.toLowerCase() ?? '';
      const who = row.changedBy?.name?.toLowerCase() ?? '';
      const oldS = (row.old_status ?? '').toLowerCase();
      const newS = row.new_status.toLowerCase();
      return room.includes(q) || who.includes(q) || oldS.includes(q) || newS.includes(q);
    });
  }, [logs, search, statusFilter]);

  const summaryEntries = summary ? Object.entries(summary) : [];

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Room Status History</h2>
          <p className="text-white/70 text-sm">Audit trail of every room status change</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-semibold text-white shadow-lg hover:bg-white/20 disabled:opacity-60"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryEntries.map(([status, count]) => {
          const m = meta(status);
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/12 bg-white/95 p-4 text-slate-900 shadow-xl"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', m.dot)} />
                <p className="text-xs font-semibold text-slate-500">{m.label}</p>
              </div>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">rooms currently</p>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/95 p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room, staff, or status..."
              aria-label="Search room status log"
              className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['all', 'available', 'occupied', 'dirty', 'cleaning', 'maintenance'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                  statusFilter === s ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/95 shadow-xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            <History className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2">
              {logs.length === 0
                ? 'No status changes recorded yet. They will appear here as rooms change state.'
                : 'No log entries match the current filter.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((row) => {
              const oldM = meta(row.old_status);
              const newM = meta(row.new_status);
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <BedDouble className="h-4 w-4 text-slate-400 shrink-0" />
                    <p className="text-sm font-bold text-slate-800">
                      Room {row.room?.room_number ?? '—'}
                    </p>
                    {row.room && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">Floor {row.room.floor}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', oldM.bg, oldM.text)}>
                      {oldM.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', newM.bg, newM.text)}>
                      {newM.label}
                    </span>
                  </div>

                  <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {row.changedBy?.name ?? 'System'}
                    </span>
                    <span>{new Date(row.changed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
