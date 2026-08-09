import type { Wish } from '@/entities/wish';
import type { Wishlist } from '@/entities/wishlist';

/** Slug served by the mock; matches the demo links in the UI. */
export const DEMO_SLUG = 'demo';

/**
 * A stable token the mock treats as "the current guest" so one wish shows as
 * already reserved by me on first load. Seeded into localStorage by the browser
 * bootstrap only — real guests still get a token on their first reservation.
 */
export const DEMO_GUEST_TOKEN = 'ba5eba11-0000-4000-8000-000000000001';

const OTHER_GUEST_TOKEN = 'c0ffee00-0000-4000-8000-000000000002';

function wishId(n: number): string {
  return `00000000-0000-4000-8000-0000000000${n.toString().padStart(2, '0')}`;
}

export const wishlistFixture: Wishlist = {
  id: '00000000-0000-4000-8000-0000000000aa',
  slug: DEMO_SLUG,
  title: 'Список желаний Димы',
  note: 'Ничего не дарите дважды — бронируйте, чтобы не пересечься.',
  ownerName: 'Дима',
  occasion: 'День рождения',
  occasionDate: '2026-09-14',
};

export const wishesFixture: Wish[] = [
  {
    id: wishId(1),
    title: 'Наушники Sony WH-1000XM5',
    url: 'https://www.sony.ru/electronics/naushniki/wh-1000xm5',
    price: 34990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish01/800/1000',
    priority: 'dream',
    note: 'Хочу чёрные, с шумодавом для самолёта.',
  },
  {
    id: wishId(2),
    title: 'Механическая клавиатура Keychron K2',
    url: 'https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard',
    price: 8990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish02/800/1000',
    priority: 'want_badly',
    note: 'Свитчи коричневые, раскладка ANSI.',
  },
  {
    id: wishId(3),
    title: "Кофемашина De'Longhi Magnifica",
    url: null,
    price: 45990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish03/800/1000',
    priority: 'would_be_nice',
    note: null,
  },
  {
    id: wishId(4),
    title: 'Электронная книга PocketBook 743',
    url: 'https://pocketbook.ru',
    price: 12990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish04/800/1000',
    priority: 'want_badly',
    note: 'С подсветкой и большим экраном.',
  },
  {
    id: wishId(5),
    title: 'Рюкзак Herschel Little America',
    url: null,
    price: 6490,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish05/800/1000',
    priority: 'would_be_nice',
    note: null,
  },
  {
    id: wishId(6),
    title: 'Умные часы Garmin Instinct 2',
    url: 'https://www.garmin.ru',
    price: 29990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish06/800/1000',
    priority: 'dream',
    note: 'Для бега и походов, с долгой батареей.',
  },
  {
    id: wishId(7),
    title: 'Настольная лампа с диммером',
    url: null,
    price: 4590,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish07/800/1000',
    priority: 'would_be_nice',
    note: 'Тёплый свет, чтобы читать вечером.',
  },
  {
    id: wishId(8),
    title: 'Плед шерстяной, серый',
    url: null,
    price: 3990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish08/800/1000',
    priority: 'would_be_nice',
    note: null,
  },
  {
    id: wishId(9),
    title: 'Набор для каллиграфии',
    url: null,
    price: 2490,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish09/800/1000',
    priority: 'would_be_nice',
    note: 'Давно хочу попробовать перья и тушь.',
  },
  {
    id: wishId(10),
    title: 'Портативная колонка JBL Charge 5',
    url: 'https://ru.jbl.com',
    price: 9990,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish10/800/1000',
    priority: 'want_badly',
    note: null,
  },
  {
    id: wishId(11),
    title: 'Книга «Пламя и кровь», Дж. Мартин',
    url: null,
    price: 1290,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish11/800/1000',
    priority: 'would_be_nice',
    note: 'В твёрдой обложке.',
  },
  {
    id: wishId(12),
    title: 'Сертификат в спа на двоих',
    url: null,
    price: 7000,
    currency: 'RUB',
    imageUrl: 'https://picsum.photos/seed/wish12/800/1000',
    priority: 'dream',
    note: 'Хочется расслабиться после сдачи проекта.',
  },
];

export interface StoredReservation {
  token: string;
  createdAt: string;
}

/** Wishes already booked when the demo loads: three by others, one by me. */
export const initialReservations: Record<string, StoredReservation> = {
  [wishId(2)]: { token: OTHER_GUEST_TOKEN, createdAt: '2026-08-01T10:00:00.000Z' },
  [wishId(5)]: { token: OTHER_GUEST_TOKEN, createdAt: '2026-08-02T12:30:00.000Z' },
  [wishId(9)]: { token: OTHER_GUEST_TOKEN, createdAt: '2026-08-03T09:15:00.000Z' },
  [wishId(11)]: { token: DEMO_GUEST_TOKEN, createdAt: '2026-08-04T18:45:00.000Z' },
};
