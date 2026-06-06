import api from './api';

const baseURL = api.defaults.baseURL ?? '';

export type ReportType = 'full' | 'revenue' | 'bookings' | 'occupancy';
export type ReportDateRange = 'today' | 'week' | 'month' | 'year';

export function buildReportPdfUrl(type: ReportType = 'full', dateRange: ReportDateRange = 'month') {
  const params = new URLSearchParams({ type, date_range: dateRange });
  return `${baseURL}/reports/pdf?${params.toString()}`;
}

export async function openReportPdf(
  type: ReportType = 'full',
  dateRange: ReportDateRange = 'month',
): Promise<void> {
  const res = await api.get('/reports/pdf', {
    params: { type, date_range: dateRange },
    responseType: 'blob',
  });
  const blob = res.data as Blob;
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank', 'noreferrer');
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error('Pop-up blocked. Please allow pop-ups to view the report.');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
