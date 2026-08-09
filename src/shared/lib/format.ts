const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** ISO string -> "14 сентября 2026 г." */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
