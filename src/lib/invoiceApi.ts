import api from './api';

const baseURL = api.defaults.baseURL ?? '';

export function buildStaffInvoiceUrl(id: number, type: 'invoice' | 'receipt' = 'invoice') {
  return `${baseURL}/bookings/${id}/invoice?type=${type}`;
}

export async function openStaffInvoice(id: number, type: 'invoice' | 'receipt' = 'invoice') {
  const res = await api.get(`/bookings/${id}/invoice`, {
    params: { type },
    responseType: 'blob',
  });
  const blob = res.data as Blob;
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank', 'noreferrer');
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error('Pop-up blocked. Please allow pop-ups to view the invoice.');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
