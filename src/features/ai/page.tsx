'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAiStore } from '@/app/store/aiStore';

export default function AiPage() {
  const { history, loading, error, fetchHistory, sendPrompt } = useAiStore();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recentResponse = useMemo(() => history[0]?.response ?? '', [history]);

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
      return;
    }

    await sendPrompt(prompt.trim());
    setPrompt('');
  }

  return (
    <div className="space-y-8 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">AI Assistant</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Ask the hotel AI for guest summaries, booking recommendations, updates, or quick policy guidance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Ask a question or enter a prompt
          </label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Generate a guest welcome message for a VIP arriving tonight."
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Thinking…' : 'Send to AI'}
            </button>

            <div className="text-sm text-slate-500">
              {history.length === 0
                ? 'No AI interactions yet.'
                : `Saved history: ${history.length} prompt${history.length > 1 ? 's' : ''}`}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total interactions</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{statistics.total}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{statistics.completed}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending / failed</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {statistics.pending + statistics.failed}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Interaction history</h2>
          <span className="text-sm text-slate-500">Most recent first</span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Your AI interaction history will appear here after the first prompt.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Prompt</p>
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{item.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={item.status} />
                    <span className="text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-800">AI response</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                    {item.response || 'Awaiting response...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {recentResponse ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Latest answer</h2>
          <p className="mt-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
            {recentResponse}
          </p>
        </section>
      ) : null}
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

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
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