/**
 * Safe formatting utilities for React Native & Hermes
 * Guarantees zero runtime crashes from undefined/null values or missing Intl methods
 */

export function formatRs(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '0';
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return '0';

  try {
    return num.toLocaleString('en-PK');
  } catch {
    // Regex comma fallback for environments with partial Intl support
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

export function formatRating(rating: number | string | null | undefined, fallback = '4.8'): string {
  if (rating === null || rating === undefined) return fallback;
  const num = typeof rating === 'number' ? rating : Number(rating);
  if (isNaN(num) || num <= 0) return fallback;
  return num.toFixed(1);
}

export function safeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

export function getInitials(name: string | null | undefined, fallback = 'TT'): string {
  if (!name) return fallback;
  const clean = String(name).trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}
