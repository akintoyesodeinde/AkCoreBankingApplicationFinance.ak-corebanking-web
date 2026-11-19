import axios from 'axios';

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
};

export function getCurrencySymbol(currency = 'NGN'): string {
  const code = (currency || 'NGN').toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function formatCurrency(amount: number | null | undefined, currency = 'NGN'): string {
  const numeric = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const symbol = getCurrencySymbol(currency);
  const absFormatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numeric));
  return numeric < 0 ? `-${symbol}${absFormatted}` : `${symbol}${absFormatted}`;
}

export function formatNumber(value: number | null | undefined): string {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-NG').format(numeric);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function toIsoDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `ak-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function extractApiError(error: unknown, fallback = 'An unexpected banking error occurred.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | string | undefined;
    if (typeof data === 'string' && data.trim().length > 0) {
      return data;
    }
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) return data.message;
      if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
      if (typeof data.error === 'string' && data.error.trim()) return data.error;
      if (data.errors && typeof data.errors === 'object') {
        const flattened = Object.values(data.errors as Record<string, unknown>)
          .flatMap((val) => (Array.isArray(val) ? val : [val]))
          .filter((val): val is string => typeof val === 'string' && val.trim().length > 0);
        if (flattened.length > 0) return flattened.join(' ');
      }
      if (typeof data.title === 'string' && data.title.trim()) return data.title;
    }
    if (error.response?.status === 403) {
      return 'Access denied (403): Your role or Segregation of Duties policy forbids this action.';
    }
    if (error.response?.status === 404) {
      return 'Requested banking record or endpoint was not found (404).';
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
