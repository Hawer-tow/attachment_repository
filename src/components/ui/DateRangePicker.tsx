import { useMemo } from 'react';
import { DatePicker } from './DatePicker';
import { cn } from '@/lib/utils';

export type DateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (iso: string) => void;
  onCheckOutChange: (iso: string) => void;
  minDate?: string;
  /** Label for the first input (default "Check-in"). */
  label1?: string;
  /** Label for the second input (default "Check-out"). */
  label2?: string;
  className?: string;
  /** Stacks vertically on small screens, side-by-side on sm+. */
  layout?: 'stack' | 'row';
};

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  label1 = 'Check-in',
  label2 = 'Check-out',
  className,
  layout = 'row',
}: DateRangePickerProps) {
  // When check-in changes, if check-out is no longer valid (before or equal to it), clear it.
  // Done at the parent level — the picker only ensures min-date disallows earlier days.
  const checkoutMin = useMemo(() => {
    if (!checkIn) return minDate;
    // check-out must be at least the day after check-in
    const d = new Date(checkIn);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [checkIn, minDate]);

  const checkinMin = minDate;

  const layoutClass = layout === 'row' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'space-y-3';

  return (
    <div className={cn(layoutClass, className)}>
      <Field label={label1}>
        <DatePicker
          value={checkIn}
          onChange={(v) => onCheckInChange(v)}
          minDate={checkinMin}
          placeholder="Select check-in"
          testId="date-range-checkin"
        />
      </Field>
      <Field label={label2}>
        <DatePicker
          value={checkOut}
          onChange={(v) => onCheckOutChange(v)}
          minDate={checkoutMin}
          placeholder="Select check-out"
          testId="date-range-checkout"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
