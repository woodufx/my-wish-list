import type { Currency, WishPriority } from '../model/schema';

const CURRENCY_SYMBOL: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
};

const priceFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** "34990" RUB -> "34 990 ₽". */
export function formatPrice(price: number, currency: Currency): string {
  return `${priceFormatter.format(price)} ${CURRENCY_SYMBOL[currency]}`;
}

const PRIORITY_LABEL: Record<WishPriority, string> = {
  dream: 'мечта',
  want_badly: 'очень хочу',
  would_be_nice: 'было бы славно',
};

export function priorityLabel(priority: WishPriority): string {
  return PRIORITY_LABEL[priority];
}

/** Sort order: dream is the strongest wish. */
export const PRIORITY_ORDER: Record<WishPriority, number> = {
  dream: 0,
  want_badly: 1,
  would_be_nice: 2,
};
