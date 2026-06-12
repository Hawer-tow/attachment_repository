'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAiStore } from '@/app/store/aiStore';



export default function AiPage() {
  const { faqs, history, loading, error, fetchFaqs, fetchHistory, sendPrompt, role } = useAiStore();
  const [prompt, setPrompt] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchFaqs().catch((err) => console.error('[AiPage] fetchFaqs error:', err));
    fetchHistory().catch((err) => console.error('[AiPage] fetchHistory error:', err));
  }, [fetchFaqs, fetchHistory]);

const recentResponse = useMemo(() => history[0]?.answer ?? '', [history]);

  const statistics = useMemo(
    () => ({
      total: history.length,
      completed: history.filter((item) => item.status === 'completed').length,
      pending: history.filter((item) => item.status === 'pending').length,
      failed: history.filter((item) => item.status === 'failed').length,
    }),
    [history]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setInfoMessage('Please enter a question or choose a suggested FAQ.');
      return;
    }

    setInfoMessage('');

    try {
      await sendPrompt(prompt.trim());
      setPrompt('');
    } catch (err) {
      console.error('[AiPage] sendPrompt error', err);
    }
  }

 // After
const handleFaqSelect = (faqId: number, question: string) => {
  setPrompt(question);
  useAiStore.getState().sendPrompt(question, faqId); // ✅ pass ID to store
};

  return (
    <div className="space-y-8 p-6">
      {/* Prompt Input Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">AI Assistant</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Ask hotel-related questions or use FAQ suggestions. If the AI cannot answer, it will fall back to support guidance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Ask a question</label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: What is the early check-in policy?"
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Processing…' : 'Send to AI'}
            </button>

            <div className="text-sm text-slate-500">
              {history.length === 0 ? 'No AI interactions yet.' : `History entries: ${history.length}`}
            </div>
          </div>

          {infoMessage ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-800">{infoMessage}</div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          {history.length > 0 ? (
            <div className="pt-2 border-t border-slate-200">
              <a
                href="#faqs"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                View & Browse FAQs
              </a>
            </div>
          ) : null}
        </form>
      </div>

      {/* Latest Response Section */}
      {recentResponse ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Latest Response</h2>
   <p className="mt-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
  {recentResponse}
</p>

   </section>
      ) : null}

      {/* History + Stats Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
        {/* Collapsed History */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Interaction History</h2>
            <p className="text-sm text-slate-500">Most recent first</p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Your AI history will show here once you ask a question.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 uppercase">Query {index + 1}</p>
                        <p className="mt-1 text-sm text-slate-700 line-clamp-1">{item.prompt}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusChip status={item.status ?? 'completed'} />
                        <span className="text-xs text-slate-400">
                          {expandedHistoryId === item.id ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {expandedHistoryId === item.id ? (
                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Prompt</p>
                        <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{item.prompt}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Response</p>
                        <div className="mt-2 rounded-2xl border border-slate-100 bg-white p-3">
                             <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{item.answer}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(item.created_at ?? '')}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <p className="text-sm text-slate-500 font-medium">AI Stats</p>
          <div className="mt-6 space-y-3">
            <Statistic label="Total queries" value={statistics.total} />
            <Statistic label="Completed" value={statistics.completed} />
            <Statistic label="Pending / failed" value={statistics.pending + statistics.failed} />
          </div>
        </div>
      </section>

        {/* FAQs Section */}
      <section id="faqs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Suggested FAQs {/** ✅ show role info */}
          </h2>
          <p className="text-sm text-slate-500">
            {role ? `FAQs for ${role}` : 'Click to populate and send to AI, or edit before submitting.'}
          </p>
        </div>

        {faqs.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            No FAQ entries are configured yet for your role.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {faqs.map((faq) => (
          <button
          key={faq.id}
          type="button"
          onClick={() => handleFaqSelect(faq.id, faq.question)}   // ✅ pass ID + question
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-sky-300 hover:bg-slate-100"
        >
          <p className="font-medium text-slate-900 text-sm">{faq.question}</p>
          <p className="mt-2 text-xs text-slate-600 line-clamp-2">
            {faq.answer ?? 'No answer available'}
          </p>
          {faq.role ? (
            <p className="mt-1 text-[10px] text-slate-400 italic">Role: {faq.role}</p>
          ) : null}
        </button>

            ))}
          </div>
        )}
      </section>

    </div>
  );
}

function Statistic({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    failed: { label: 'Failed', className: 'bg-rose-100 text-rose-700' },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-700',
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}