import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlarmClock,
  Car,
  CheckCircle2,
  Hotel,
  Loader2,
  MapPin,
  Phone,
  Plane,
  Shirt,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { submitServiceRequest, type ServiceRequestType } from '@/lib/portalApi';

type ServiceKey = ServiceRequestType;

const SERVICES: { key: ServiceKey; title: string; desc: string; Icon: typeof Car; accent: string }[] = [
  { key: 'taxi',         title: 'Taxi',                desc: 'On-demand cab to anywhere in the city.',                       Icon: Car,         accent: 'from-amber-500 to-orange-600' },
  { key: 'airport',      title: 'Airport Transfer',    desc: 'Scheduled pickup, flight tracking, fixed price.',              Icon: Plane,       accent: 'from-sky-500 to-indigo-600' },
  { key: 'wakeup',       title: 'Wake-up Call',        desc: 'A gentle call at the time you choose.',                        Icon: AlarmClock,  accent: 'from-violet-500 to-purple-600' },
  { key: 'laundry',      title: 'Laundry',             desc: 'Same-day wash & fold, picked up from your room.',              Icon: Shirt,       accent: 'from-rose-500 to-pink-600' },
  { key: 'housekeeping', title: 'Housekeeping',        desc: 'Extra towels, toiletries, or a room refresh.',                 Icon: Sparkles,    accent: 'from-emerald-500 to-teal-600' },
  { key: 'tour',         title: 'Tour Booking',        desc: 'City tours, safari, and day trips with vetted guides.',        Icon: MapPin,      accent: 'from-cyan-500 to-blue-600' },
];

type FormState = {
  guest_name: string;
  room_number: string;
  phone: string;
  email: string;
  preferred_at: string;
  details: string;
};

const emptyForm: FormState = {
  guest_name: '',
  room_number: '',
  phone: '',
  email: '',
  preferred_at: '',
  details: '',
};

type Toast =
  | { kind: 'success'; reference: string; service: string }
  | { kind: 'error'; message: string };

export default function PortalConciergePage() {
  const [open, setOpen] = useState<ServiceKey | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  function reset() {
    setForm(emptyForm);
    setOpen(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!open) return;
    if (!form.guest_name.trim() || !form.phone.trim()) return;

    setSending(true);
    submitServiceRequest({
      service_type: open,
      guest_name: form.guest_name.trim(),
      room_number: form.room_number.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      preferred_at: form.preferred_at || undefined,
      details: form.details.trim() || undefined,
    })
      .then((res) => {
        setToast({
          kind: 'success',
          reference: res.data.data.reference,
          service: SERVICES.find((s) => s.key === open)?.title ?? 'Request',
        });
        reset();
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setToast({ kind: 'error', message: msg ?? 'Could not send the request. Please try again.' });
        setOpen(null);
      })
      .finally(() => {
        setSending(false);
        window.setTimeout(() => setToast(null), 6000);
      });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Anything you need, anytime</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Concierge Services</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Our team handles the details so you can focus on enjoying your stay.</p>
      </header>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
              toast.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {toast.kind === 'success'
              ? `${toast.service} request received — reference ${toast.reference}. The concierge team will be in touch shortly.`
              : toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ key, title, desc, Icon, accent }) => (
          <button
            key={key}
            onClick={() => setOpen(key)}
            type="button"
            className="group rounded-2xl border border-white/14 bg-white/95 p-5 text-left text-slate-900 shadow-xl transition hover:-translate-y-0.5"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
            <p className="mt-3 text-xs font-semibold text-cyan-700 group-hover:text-cyan-800">Request →</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
            onClick={() => !sending && reset()}
          >
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Concierge</p>
                  <h2 className="text-lg font-bold text-slate-900">{SERVICES.find((s) => s.key === open)?.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={sending}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Your name</span>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={form.guest_name}
                      onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                      placeholder="As on your booking"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </div>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Room number</span>
                    <input
                      type="text"
                      value={form.room_number}
                      onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                      placeholder="e.g. 401"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Phone</span>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+2547XX XXX XXX"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Preferred time (optional)</span>
                  <input
                    type="datetime-local"
                    value={form.preferred_at}
                    onChange={(e) => setForm({ ...form, preferred_at: e.target.value })}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Details (optional)</span>
                  <textarea
                    rows={3}
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    placeholder="Pickup address, flight number, garment count, etc."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={sending}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Hotel className="h-3.5 w-3.5" /> Send request
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
