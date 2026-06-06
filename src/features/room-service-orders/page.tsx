import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Coffee,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchRoomServiceOrders,
  updateRoomServiceOrderStatus,
  type StaffRoomServiceOrder,
} from '@/lib/protectedEndpoints';

type OrderStatus = StaffRoomServiceOrder['status'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; dot: string; chip: string; order: number }> = {
  received:   { label: 'Received',    dot: 'bg-slate-500',  chip: 'bg-slate-100 text-slate-700',   order: 0 },
  preparing:  { label: 'In kitchen',  dot: 'bg-amber-500',  chip: 'bg-amber-100 text-amber-700',   order: 1 },
  on_the_way: { label: 'On the way',  dot: 'bg-sky-500',    chip: 'bg-sky-100 text-sky-700',       order: 2 },
  delivered:  { label: 'Delivered',   dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700', order: 3 },
  cancelled:  { label: 'Cancelled',   dot: 'bg-rose-500',   chip: 'bg-rose-100 text-rose-700',     order: 4 },
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  received:   'preparing',
  preparing:  'on_the_way',
  on_the_way: 'delivered',
  delivered:  null,
  cancelled:  null,
};

function money(n: string | number) {
  return `KES ${Number(n).toLocaleString()}`;
}

export default function RoomServiceOrdersPage() {
  const [orders, setOrders] = useState<StaffRoomServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [advancing, setAdvancing] = useState<number | null>(null);
  const [activeOrder, setActiveOrder] = useState<StaffRoomServiceOrder | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchRoomServiceOrders();
      const payload = res.data.data;
      const list: StaffRoomServiceOrder[] = Array.isArray(payload) ? payload : (payload as { data: StaffRoomServiceOrder[] })?.data ?? [];
      setOrders(list);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not load room service orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .filter((o) => {
        if (!q) return true;
        return [o.reference, o.guest_name, o.room_number ?? '', o.phone ?? '']
          .some((s) => s.toLowerCase().includes(q));
      });
  }, [orders, search, statusFilter]);

  const kpis = useMemo(() => {
    return {
      received:   orders.filter((o) => o.status === 'received').length,
      preparing:  orders.filter((o) => o.status === 'preparing').length,
      on_the_way: orders.filter((o) => o.status === 'on_the_way').length,
      delivered:  orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  async function advance(o: StaffRoomServiceOrder) {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    setAdvancing(o.id);
    try {
      const res = await updateRoomServiceOrderStatus(o.id, next);
      const updated = res.data.data;
      setOrders((all) => all.map((row) => (row.id === o.id ? updated : row)));
      if (activeOrder?.id === o.id) setActiveOrder(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not update order status.');
    } finally {
      setAdvancing(null);
    }
  }

  async function cancel(o: StaffRoomServiceOrder) {
    if (!confirm(`Cancel order ${o.reference}?`)) return;
    setAdvancing(o.id);
    try {
      const res = await updateRoomServiceOrderStatus(o.id, 'cancelled');
      const updated = res.data.data;
      setOrders((all) => all.map((row) => (row.id === o.id ? updated : row)));
      if (activeOrder?.id === o.id) setActiveOrder(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not cancel the order.');
    } finally {
      setAdvancing(null);
    }
  }

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Room Service Orders</h2>
          <p className="text-white/70 text-sm">Kitchen fulfilment for in-room dining requests</p>
        </div>
        <button onClick={() => void load()} disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-semibold text-white shadow-lg hover:bg-white/20 disabled:opacity-60">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          <X className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          { key: 'received',   label: 'Received',   Icon: ShoppingBag,  from: 'from-slate-500 to-slate-700' },
          { key: 'preparing',  label: 'In kitchen', Icon: UtensilsCrossed, from: 'from-amber-500 to-orange-600' },
          { key: 'on_the_way', label: 'On the way', Icon: Coffee,       from: 'from-sky-500 to-indigo-600' },
          { key: 'delivered',  label: 'Delivered',  Icon: CheckCircle2, from: 'from-emerald-500 to-teal-700' },
        ] as const).map((kpi) => {
          const Icon = kpi.Icon;
          return (
            <motion.div key={kpi.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br', kpi.from)}>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/20 p-2"><Icon className="h-5 w-5" /></div>
                <span className="text-2xl font-bold">{kpis[kpi.key]}</span>
              </div>
              <p className="mt-3 text-sm text-white/85">{kpi.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/95 p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, guest, or room..."
              aria-label="Search room service orders"
              className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['all', 'received', 'preparing', 'on_the_way', 'delivered', 'cancelled'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                  statusFilter === s ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/95 shadow-xl overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-10 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Coffee className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              {orders.length === 0 ? 'No room service orders yet.' : 'No orders match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Guest / Room</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => {
                  const status = STATUS_CONFIG[o.status];
                  const next = NEXT_STATUS[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{o.reference}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="font-semibold">{o.guest_name}</p>
                        {o.room_number && <p className="text-[11px] text-slate-400">Room {o.room_number}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setActiveOrder(o)} className="text-left text-xs text-cyan-700 hover:underline">
                          {o.items.length} item{o.items.length === 1 ? '' : 's'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{money(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.chip)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} /> {status.label}
                        </span>
                        {o.delivered_at && (
                          <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(o.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          {next && (
                            <button onClick={() => void advance(o)} disabled={advancing === o.id}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50">
                              {advancing === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                              Mark {STATUS_CONFIG[next].label.toLowerCase()}
                            </button>
                          )}
                          {o.status !== 'cancelled' && o.status !== 'delivered' && (
                            <button onClick={() => void cancel(o)} disabled={advancing === o.id}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveOrder(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Room service order</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 font-mono">{activeOrder.reference}</h2>
                </div>
                <button type="button" onClick={() => setActiveOrder(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-700">
                  <strong>{activeOrder.guest_name}</strong>
                  {activeOrder.room_number && <> · Room {activeOrder.room_number}</>}
                </p>
                <ul className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                  {activeOrder.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between">
                      <span className="text-slate-700">{it.quantity}× {it.item_name}</span>
                      <span className="font-semibold text-slate-800">{money(it.line_total)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold">
                    <span>Total</span><span>{money(activeOrder.total)}</span>
                  </li>
                </ul>
                {activeOrder.notes && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <strong>Notes:</strong> {activeOrder.notes}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
