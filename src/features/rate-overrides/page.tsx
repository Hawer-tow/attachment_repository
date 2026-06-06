import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  DollarSign,
  Edit,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createRateOverride,
  deleteRateOverride,
  fetchRateOverrides,
  fetchRoomTypes,
  updateRateOverride,
  type ApiRateOverride,
  type ApiRoomType,
} from '@/lib/protectedEndpoints';

type FormState = {
  room_type_id: number | '';
  start_date: string;
  end_date: string;
  price: string;
};

const emptyForm: FormState = {
  room_type_id: '',
  start_date: '',
  end_date: '',
  price: '',
};

export default function RateOverridesPage() {
  const [overrides, setOverrides] = useState<ApiRateOverride[]>([]);
  const [roomTypes, setRoomTypes] = useState<ApiRoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [or, rt] = await Promise.all([fetchRateOverrides(), fetchRoomTypes()]);
      const ovList: ApiRateOverride[] = Array.isArray(or.data) ? or.data : or.data.data ?? [];
      const rtList: ApiRoomType[] = Array.isArray(rt.data) ? rt.data : rt.data.data ?? [];
      setOverrides(ovList);
      setRoomTypes(rtList);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not load rate overrides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return overrides
      .filter((o) => typeFilter === 'all' || o.room_type_id === typeFilter)
      .filter((o) => {
        if (!q) return true;
        const typeName = (o.roomType?.name ?? o.room_type?.name ?? '').toLowerCase();
        return typeName.includes(q) || o.price.toString().includes(q);
      });
  }, [overrides, search, typeFilter]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function startEdit(o: ApiRateOverride) {
    setEditingId(o.id);
    setForm({
      room_type_id: o.room_type_id,
      start_date: o.start_date?.slice(0, 10) ?? '',
      end_date: o.end_date?.slice(0, 10) ?? '',
      price: String(o.price),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.room_type_id || !form.start_date || !form.end_date || !form.price.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        room_type_id: Number(form.room_type_id),
        start_date: form.start_date,
        end_date: form.end_date,
        price: Number(form.price),
      };
      if (editingId) {
        await updateRateOverride(editingId, payload);
        setNotice('Rate override updated.');
      } else {
        await createRateOverride(payload);
        setNotice('Rate override created.');
      }
      setModalOpen(false);
      await load();
      window.setTimeout(() => setNotice(''), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not save rate override.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this rate override?')) return;
    setDeleting(id);
    try {
      await deleteRateOverride(id);
      setNotice('Rate override deleted.');
      await load();
      window.setTimeout(() => setNotice(''), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not delete rate override.');
    } finally {
      setDeleting(null);
    }
  }

  function typeName(o: ApiRateOverride): string {
    return o.roomType?.name ?? o.room_type?.name ?? '—';
  }

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Rate Overrides</h2>
          <p className="text-white/70 text-sm">Seasonal and event pricing layered on top of base room-type rates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-semibold text-white shadow-lg hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={startCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4" />
            New override
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> {notice}
        </div>
      )}

      <div className="rounded-2xl border border-white/12 bg-white/95 p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by room type or price..."
              aria-label="Search rate overrides"
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
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                typeFilter === 'all' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              All types
            </button>
            {roomTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  typeFilter === t.id ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/95 shadow-xl overflow-hidden">
        {loading && overrides.length === 0 ? (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              {overrides.length === 0
                ? 'No rate overrides yet. Add one to set seasonal or event pricing.'
                : 'No overrides match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Room type</th>
                  <th className="px-4 py-3 text-left">Date range</th>
                  <th className="px-4 py-3 text-right">Override price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{typeName(o)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                        {o.start_date?.slice(0, 10)} → {o.end_date?.slice(0, 10)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700">
                        <DollarSign className="h-3.5 w-3.5" />
                        {Number(o.price).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => startEdit(o)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                          aria-label={`Edit override for ${typeName(o)}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => void handleDelete(o.id)}
                          disabled={deleting === o.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                          aria-label={`Delete override for ${typeName(o)}`}
                        >
                          {deleting === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !saving && setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    {editingId ? 'Edit' : 'New'} rate override
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {editingId ? 'Update pricing' : 'Set seasonal pricing'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Room type</span>
                  <select
                    value={form.room_type_id}
                    onChange={(e) => setForm({ ...form, room_type_id: e.target.value ? Number(e.target.value) : '' })}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  >
                    <option value="">Select a room type</option>
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (base KES {Number(t.base_price).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Start date</span>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">End date</span>
                    <input
                      type="date"
                      value={form.end_date}
                      min={form.start_date || undefined}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Price (KES per night)</span>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="e.g. 12000"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    This price will be used for any booking whose stay overlaps this date range.
                  </p>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
