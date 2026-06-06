import { useState } from 'react';
import { CreditCard, FileText, Hash, Phone, Printer, Receipt, User, X } from 'lucide-react';
import { buildPortalInvoiceUrl, payPortalDeposit, type MpesaStkResponse } from '@/lib/portalApi';

type Invoice = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending';
  bookingId?: number;
  lastName?: string;
};

const INVOICES: Invoice[] = [
  { id: 'INV-2026-0042', date: '2026-06-04', description: 'Room 401 · 5 nights (Brian Mutua)',   amount: 218500, status: 'pending' },
  { id: 'INV-2026-0041', date: '2026-06-03', description: 'Room 202 · 3 nights (Sandra Achieng)', amount: 41520,  status: 'paid' },
  { id: 'INV-2026-0040', date: '2026-06-02', description: 'Room 110 · 4 nights (Grace Wanjiru)',  amount: 36960,  status: 'paid' },
  { id: 'INV-2026-0039', date: '2026-06-01', description: 'Room 301 · 5 nights (James Odhiambo)', amount: 99000,  status: 'paid' },
];

type PayState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; data: MpesaStkResponse }
  | { status: 'error'; message: string };

type PrintState = { inv: Invoice } | null;

export default function PortalBillingPage() {
  const [pay, setPay] = useState<PayState>({ status: 'idle' });
  const [phone, setPhone] = useState('+254');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [printing, setPrinting] = useState<PrintState>(null);
  const [printRef, setPrintRef] = useState('');
  const [printLast, setPrintLast] = useState('');
  const [printError, setPrintError] = useState('');

  const total = INVOICES.reduce((s, i) => s + i.amount, 0);
  const paid  = INVOICES.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const outstanding = INVOICES.find((i) => i.status === 'pending') ?? null;

  function openPay(inv: Invoice) {
    setPayingInvoice(inv);
    setPay({ status: 'idle' });
  }

  function openPrint(inv: Invoice) {
    setPrinting({ inv });
    setPrintRef(inv.id);
    setPrintLast('');
    setPrintError('');
  }

  function submitPrint() {
    if (!printing) return;
    if (!printRef.trim() || !printLast.trim()) {
      setPrintError('Enter your booking reference and last name.');
      return;
    }
    setPrintError('');
    // Resolve the real booking id from the reference + last name, then open the PDF.
    void (async () => {
      try {
        const { lookupPortalBooking } = await import('@/lib/portalApi');
        const res = await lookupPortalBooking({ reference: printRef.trim(), lastName: printLast.trim() });
        const booking = res.data.data;
        if (!booking) throw new Error('not found');
        const url = buildPortalInvoiceUrl(booking.id, printLast.trim(), printing.inv.status === 'paid' ? 'receipt' : 'invoice');
        window.open(url, '_blank', 'noreferrer');
        setPrinting(null);
      } catch {
        setPrintError('No booking found for that reference and last name.');
      }
    })();
  }

  async function handlePay() {
    if (!payingInvoice || !phone.trim()) return;
    setPay({ status: 'sending' });
    try {
      const res = await payPortalDeposit({
        phone: phone.trim(),
        amount: payingInvoice.amount,
        reference: payingInvoice.id.slice(0, 12),
      });
      setPay({ status: 'sent', data: res.data.data });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPay({ status: 'error', message: msg ?? 'M-Pesa request failed. Please try again.' });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Transparent billing</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Billing & Payments</h1>
        <p className="mt-1 text-sm text-cyan-50/70">View invoices, download receipts, and pay outstanding balances with M-Pesa.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total billed" value={`KES ${total.toLocaleString()}`} />
        <Stat label="Paid"          value={`KES ${paid.toLocaleString()}`} />
        <Stat label="Outstanding"   value={`KES ${(total - paid).toLocaleString()}`} accent />
      </div>

      {outstanding && (
        <section className="rounded-2xl border border-amber-300/40 bg-amber-50 p-5 text-amber-900 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Outstanding balance</p>
              <p className="mt-1 text-xl font-bold">{outstanding.id} · KES {outstanding.amount.toLocaleString()}</p>
              <p className="text-xs text-amber-800">{outstanding.description}</p>
            </div>
            <button onClick={() => openPay(outstanding)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-500">
              <CreditCard className="h-4 w-4" /> Pay with M-Pesa
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/14 bg-white/95 text-slate-900 shadow-xl">
        <header className="flex items-center gap-2 border-b border-slate-200 p-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          <Receipt className="h-4 w-4" /> Recent invoices
        </header>
        <ul className="divide-y divide-slate-200">
          {INVOICES.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{inv.id}</p>
                <p className="text-xs text-slate-500">{inv.date} · {inv.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-cyan-700">KES {inv.amount.toLocaleString()}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {inv.status}
                </span>
                {inv.status === 'pending' && (
                  <button onClick={() => openPay(inv)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 text-xs font-semibold text-white hover:bg-amber-500">
                    <CreditCard className="h-3.5 w-3.5" /> Pay
                  </button>
                )}
                <button onClick={() => openPrint(inv)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  <Printer className="h-3.5 w-3.5" /> {inv.status === 'paid' ? 'Receipt' : 'Print'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setPayingInvoice(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/14 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pay with M-Pesa</p>
                <h2 className="mt-1 text-lg font-bold">{payingInvoice.id}</h2>
                <p className="text-xs text-slate-500">{payingInvoice.description}</p>
              </div>
              <button onClick={() => setPayingInvoice(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {pay.status !== 'sent' && (
              <>
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Amount due</p>
                  <p className="text-2xl font-bold text-cyan-700">KES {payingInvoice.amount.toLocaleString()}</p>
                </div>
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-600">M-Pesa phone</span>
                  <div className="mt-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
                    <Phone className="h-3.5 w-3.5 text-cyan-600" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2547XX XXX XXX"
                      className="h-9 w-full bg-transparent text-sm focus:outline-none" />
                  </div>
                </label>
                {pay.status === 'error' && (
                  <p className="mt-2 text-xs font-medium text-rose-700">{pay.message}</p>
                )}
                <button onClick={handlePay} disabled={pay.status === 'sending' || !phone.trim()}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
                  {pay.status === 'sending' ? 'Sending prompt…' : <><CreditCard className="h-4 w-4" /> Send STK push</>}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">An M-Pesa prompt will appear on the phone number above. Enter your PIN to confirm.</p>
              </>
            )}

            {pay.status === 'sent' && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-800">Prompt sent</p>
                <p className="mt-1 text-xs text-emerald-900/80">{pay.data.CustomerMessage}</p>
                <p className="mt-2 text-[11px] text-emerald-900/70">Reference: {pay.data.CheckoutRequestID}. This dialog will close automatically.</p>
                <button onClick={() => setPayingInvoice(null)}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {printing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setPrinting(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/14 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Print document</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                  {printing.inv.status === 'paid' ? <Receipt className="h-4 w-4 text-cyan-600" /> : <FileText className="h-4 w-4 text-cyan-600" />}
                  {printing.inv.id}
                </h2>
                <p className="text-xs text-slate-500">{printing.inv.description}</p>
              </div>
              <button onClick={() => setPrinting(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 rounded-lg bg-cyan-50 px-3 py-2 text-xs text-cyan-900/80">
              We'll fetch the official {printing.inv.status === 'paid' ? 'receipt' : 'invoice'} (with StaySync signature) and open it as a PDF in a new tab. You can then print or save it from there.
            </p>

            <label className="mt-3 block">
              <span className="text-xs font-medium text-slate-600">Booking reference</span>
              <div className="mt-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
                <Hash className="h-3.5 w-3.5 text-cyan-600" />
                <input value={printRef} onChange={(e) => setPrintRef(e.target.value)} placeholder="BK-XXXXXX"
                  className="h-9 w-full bg-transparent text-sm focus:outline-none" />
              </div>
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-medium text-slate-600">Last name</span>
              <div className="mt-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
                <User className="h-3.5 w-3.5 text-cyan-600" />
                <input value={printLast} onChange={(e) => setPrintLast(e.target.value)} placeholder="As on the booking"
                  className="h-9 w-full bg-transparent text-sm focus:outline-none" />
              </div>
            </label>
            {printError && <p className="mt-2 text-xs font-medium text-rose-700">{printError}</p>}

            <button onClick={submitPrint}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500">
              <Printer className="h-4 w-4" /> Generate & open PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-amber-300/40 bg-amber-50 text-amber-800' : 'border-white/14 bg-white/95 text-slate-900'} shadow-xl`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
