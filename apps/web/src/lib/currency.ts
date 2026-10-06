/**
 * Currency Formatting Utility for To Be Take Marketplace
 * Enforces Pakistani Rupees (PKR / Rs) across the entire platform
 */

export interface FormatCurrencyOptions {
  showDecimals?: boolean | number;
  prefix?: string;
}

/**
 * Format any number or numeric string to Pakistani Rupees (e.g. Rs 2,500 or Rs 2,500.00)
 */
export function formatPKR(
  amount: number | string | null | undefined,
  options?: FormatCurrencyOptions,
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rs 0.00';
  }
  const num = Number(amount);
  const prefix = options?.prefix !== undefined ? options.prefix : 'Rs ';
  let decimals = 2;
  if (typeof options?.showDecimals === 'boolean') {
    decimals = options.showDecimals ? 2 : 0;
  } else if (typeof options?.showDecimals === 'number') {
    decimals = options.showDecimals;
  }

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix}${formatted}`;
}

/**
 * Short alias for standard price formatting in UI (e.g. Rs 189.99)
 */
export function formatPrice(amount: number | string | null | undefined): string {
  return formatPKR(amount, { showDecimals: true, prefix: 'Rs ' });
}
