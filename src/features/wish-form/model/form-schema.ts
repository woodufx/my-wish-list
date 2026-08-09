import { z } from 'zod';
import { WishPrioritySchema, type Wish, type WishDraft } from '@/entities/wish';

const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || z.url().safeParse(value).success, message);

/** Validates the raw string/enum form fields (react-hook-form works with these). */
export const WishFormSchema = z.object({
  title: z.string().trim().min(1, 'Без названия желание не сохранить'),
  url: optionalUrl('Ссылка выглядит неправильно'),
  price: z
    .string()
    .refine(
      (value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
      'Цена — это неотрицательное число',
    ),
  imageUrl: optionalUrl('Ссылка на картинку выглядит неправильно'),
  priority: WishPrioritySchema,
  note: z.string().trim(),
});

export type WishFormValues = z.infer<typeof WishFormSchema>;

export const EMPTY_FORM: WishFormValues = {
  title: '',
  url: '',
  price: '',
  imageUrl: '',
  priority: 'want_badly',
  note: '',
};

/** Prefills the form when editing an existing wish. */
export function wishToForm(wish: Wish): WishFormValues {
  return {
    title: wish.title,
    url: wish.url ?? '',
    price: String(wish.price),
    imageUrl: wish.imageUrl ?? '',
    priority: wish.priority,
    note: wish.note ?? '',
  };
}

/** Converts validated form values into the API draft payload. */
export function formToDraft(values: WishFormValues): WishDraft {
  return {
    title: values.title.trim(),
    url: values.url.trim() || null,
    price: Number(values.price),
    currency: 'RUB',
    imageUrl: values.imageUrl.trim() || null,
    priority: values.priority,
    note: values.note.trim() || null,
  };
}
