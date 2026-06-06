import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Percent,
  Phone,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
} from 'lucide-react';
import api from '@/lib/api';

type Settings = {
  'hotel.name': string;
  'hotel.address': string;
  'hotel.phone': string;
  'hotel.email': string;
  'tax.rate': string;
  'pricing.weekend_surcharge': string;
  'pricing.currency': string;
  'cancellation.grace_hours': string;
};

const FIELD_GROUPS: Array<{
  title: string;
  Icon: typeof Building2;
  fields: Array<{
    key: keyof Settings;
    label: string;
    hint?: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'percent';
  }>;
}> = [
  {
    title: 'Hotel profile',
    Icon: Building2,
    fields: [
      { key: 'hotel.name',    label: 'Hotel name',    type: 'text' },
      { key: 'hotel.address', label: 'Address',       type: 'text' },
      { key: 'hotel.phone',   label: 'Phone',         type: 'tel' },
      { key: 'hotel.email',   label: 'Email',         type: 'email' },
    ],
  },
  {
    title: 'Pricing',
    Icon: Percent,
    fields: [
      { key: 'tax.rate',                  label: 'Tax rate',                  type: 'percent', hint: 'Enter as a decimal — 0.16 means 16% VAT' },
      { key: 'pricing.weekend_surcharge', label: 'Weekend surcharge (KES)',   type: 'number',  hint: 'Flat amount added to the nightly rate for Friday/Saturday nights' },
      { key: 'pricing.currency',          label: 'Currency code',             type: 'text' },
    ],
  },
  {
    title: 'Operations',
    Icon: Calendar,
    fields: [
      { key: 'cancellation.grace_hours', label: 'Cancellation grace (hours)', type: 'number', hint: 'Hours before check-in during which a free cancellation is allowed' },
    ],
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Settings | null>(null);
  const [defaults, setDefaults] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ success: boolean; data: { values: Settings; defaults: Settings } }>('/settings');
      setValues(res.data.data.values);
      setDefaults(res.data.data.defaults);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function update(key: keyof Settings, value: string) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function resetField(key: keyof Settings) {
    if (defaults) setValues((prev) => (prev ? { ...prev, [key]: defaults[key] } : prev));
  }

  function isDirty(key: keyof Settings): boolean {
    return !!values && !!defaults && values[key] !== defaults[key];
  }

  async function save() {
    if (!values) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await api.put<{ success: boolean; data: { values: Settings } }>('/settings', values);
      setValues(res.data.data.values);
      setNotice('Settings saved. New bookings will use the updated tax and weekend pricing.');
      window.setTimeout(() => setNotice(''), 5000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Hotel Settings</h2>
          <p className="text-white/70 text-sm">Tax rate, weekend surcharge, and hotel profile used across the system</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-semibold text-white shadow-lg hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
            Reload
          </button>
          <button
            onClick={save}
            disabled={loading || saving || !values}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-cyan-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
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

      {loading || !values ? (
        <div className="flex justify-center py-10 text-white/70">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FIELD_GROUPS.map(({ title, Icon, fields }) => (
            <motion.section
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/12 bg-white/95 p-5 text-slate-900 shadow-xl"
            >
              <header className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="text-[11px] text-slate-500">Changes apply to the next booking created.</p>
                </div>
              </header>

              <div className="space-y-3">
                {fields.map((field) => {
                  const dirty = isDirty(field.key);
                  return (
                    <label key={field.key} className="block">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-600">{field.label}</span>
                        {dirty && (
                          <button
                            type="button"
                            onClick={() => resetField(field.key)}
                            className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 hover:text-cyan-700"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                      <div className="relative mt-1">
                        {field.type === 'email' && <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                        {field.type === 'tel'   && <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                        {field.type === 'percent' && <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                        {field.type === 'number' && <SettingsIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                        {(field.type === 'text') && <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                        <input
                          type={field.type === 'percent' ? 'number' : field.type}
                          step={field.type === 'percent' || field.type === 'number' ? '0.01' : undefined}
                          min={field.type === 'percent' || field.type === 'number' ? '0' : undefined}
                          value={values[field.key]}
                          onChange={(e) => update(field.key, e.target.value)}
                          className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 ${
                            dirty ? 'border-amber-300 focus:border-amber-400' : 'border-slate-200 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                      {field.hint && <p className="mt-1 text-[10px] text-slate-400">{field.hint}</p>}
                    </label>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
