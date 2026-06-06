import { useEffect, useMemo, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isValid,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';

export type DatePickerProps = {
  value: string;
  onChange: (iso: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'start' | 'center' | 'end';
  testId?: string;
};

function toDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

function isoOf(d: Date | null): string {
  if (!d || !isValid(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Pick a date',
  disabled,
  className,
  align = 'start',
  testId,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => toDate(value), [value]);
  const min     = useMemo(() => toDate(minDate), [minDate]);
  const max     = useMemo(() => toDate(maxDate), [maxDate]);

  const [view, setView] = useState<Date>(selected ?? new Date());
  useEffect(() => {
    if (selected) setView(selected);
  }, [selected]);

  const minMonth = min ? startOfMonth(min) : null;
  const maxMonth = max ? startOfMonth(max) : null;
  const canPrev = !minMonth || isAfter(view, minMonth);
  const canNext = !maxMonth || isBefore(view, maxMonth);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(view), { weekStartsOn: 1 });
    const gridEnd   = endOfWeek(endOfMonth(view),   { weekStartsOn: 1 });
    const cells: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      cells.push(d);
      d = addDays(d, 1);
    }
    return cells;
  }, [view]);

  const gridRef = useRef<HTMLDivElement>(null);

  function isDisabled(d: Date): boolean {
    if (min && isBefore(d, min)) return true;
    if (max && isAfter(d, max))  return true;
    return false;
  }

  function pick(d: Date) {
    if (isDisabled(d)) return;
    onChange(isoOf(d));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    const base = selected ?? new Date();
    let next = base;
    if (e.key === 'ArrowLeft')  next = addDays(base, -1);
    if (e.key === 'ArrowRight') next = addDays(base, 1);
    if (e.key === 'ArrowUp')    next = addDays(base, -7);
    if (e.key === 'ArrowDown')  next = addDays(base, 7);
    if (e.key === 'Enter' && selected) { setOpen(false); return; }
    if (isDisabled(next)) return;
    onChange(isoOf(next));
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid={testId}
          className={cn(
            'inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition',
            'hover:border-cyan-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalIcon className="h-3.5 w-3.5 text-cyan-600" />
            {selected ? format(selected, 'EEE, d MMM yyyy') : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={6}
          className="z-50 w-[300px] rounded-2xl border border-white/20 bg-white p-3 text-slate-900 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
        >
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={() => canPrev && setView((v) => addMonths(v, -1))}
              disabled={!canPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold tracking-wide">{format(view, 'MMMM yyyy')}</div>
            <button
              type="button"
              onClick={() => canNext && setView((v) => addMonths(v, 1))}
              disabled={!canNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <div key={d}>{d}</div>)}
          </div>

          <div
            ref={gridRef}
            role="grid"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="grid grid-cols-7 gap-1 outline-none"
          >
            {days.map((d) => {
              const inMonth = isSameMonth(d, view);
              const isSel   = selected ? isSameDay(d, selected) : false;
              const isToday = isSameDay(d, new Date());
              const disabled = isDisabled(d);
              return (
                <button
                  type="button"
                  key={d.toISOString()}
                  role="gridcell"
                  aria-selected={isSel}
                  disabled={disabled}
                  onClick={() => pick(d)}
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs transition',
                    inMonth ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600',
                    disabled && 'opacity-30 cursor-not-allowed',
                    !disabled && !isSel && 'hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-950/40',
                    isSel && 'bg-cyan-600 text-white shadow-md shadow-cyan-700/30 hover:bg-cyan-600 hover:text-white',
                    !isSel && isToday && 'ring-1 ring-cyan-400',
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800">
            <button type="button" onClick={() => pick(new Date())} className="rounded px-1.5 py-1 transition hover:text-cyan-600">Today</button>
            {selected && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="rounded px-1.5 py-1 transition hover:text-rose-600">Clear</button>
            )}
          </div>

          <Popover.Arrow className="fill-white drop-shadow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
