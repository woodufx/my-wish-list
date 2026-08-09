import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  WishCard,
  type WishPriority,
  type WishDraft,
  type Wish,
  type WishPublic,
} from '@/entities/wish';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import {
  EMPTY_FORM,
  WishFormSchema,
  formToDraft,
  wishToForm,
  type WishFormValues,
} from '../model/form-schema';
import styles from './WishForm.module.css';

interface WishFormProps {
  mode: 'create' | 'edit';
  initialWish?: Wish;
  saving?: boolean;
  onSubmit: (draft: WishDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PRIORITIES: { value: WishPriority; label: string }[] = [
  { value: 'would_be_nice', label: 'было бы славно' },
  { value: 'want_badly', label: 'очень хочу' },
  { value: 'dream', label: 'мечта' },
];

export function WishForm({
  mode,
  initialWish,
  saving = false,
  onSubmit,
  onCancel,
  onDelete,
}: WishFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WishFormValues>({
    resolver: zodResolver(WishFormSchema),
    defaultValues: initialWish ? wishToForm(initialWish) : EMPTY_FORM,
    mode: 'onBlur',
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const values = watch();

  const preview: WishPublic = {
    id: 'preview',
    title: values.title.trim() || 'Название желания',
    url: values.url.trim() || null,
    price: Number(values.price) || 0,
    currency: 'RUB',
    imageUrl: values.imageUrl.trim() || null,
    priority: values.priority,
    note: values.note.trim() || 'Заметка появится здесь',
    reservationStatus: 'free',
  };

  const submit = handleSubmit((data) => {
    onSubmit(formToDraft(data));
  });

  return (
    <>
      <div className={styles.layout}>
        <form className={styles.formCol} onSubmit={submit} noValidate>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={cn('eyebrow', styles.label)} htmlFor="wish-title">
                Название
              </label>
              <input
                id="wish-title"
                className={cn(styles.input, styles.titleInput, errors.title && styles.invalid)}
                placeholder="Например, кофемашина"
                aria-invalid={errors.title ? true : undefined}
                {...register('title')}
              />
              {errors.title && <span className={styles.error}>{errors.title.message}</span>}
            </div>

            <div className={styles.row}>
              <div className={cn(styles.field, 'flex-1')}>
                <label className={cn('eyebrow', styles.label)} htmlFor="wish-url">
                  Ссылка на товар
                </label>
                <input
                  id="wish-url"
                  className={cn(styles.input, errors.url && styles.invalid)}
                  placeholder="Вставьте ссылку на магазин"
                  aria-invalid={errors.url ? true : undefined}
                  {...register('url')}
                />
                {errors.url && <span className={styles.error}>{errors.url.message}</span>}
              </div>
              <div className={styles.field} style={{ width: 200 }}>
                <label className={cn('eyebrow', styles.label)} htmlFor="wish-price">
                  Цена
                </label>
                <div className={styles.priceRow}>
                  <input
                    id="wish-price"
                    inputMode="numeric"
                    className={cn(styles.input, errors.price && styles.invalid)}
                    placeholder="0"
                    aria-invalid={errors.price ? true : undefined}
                    {...register('price')}
                  />
                  <span className={styles.currency} aria-hidden="true">
                    ₽
                  </span>
                </div>
                {errors.price && <span className={styles.error}>{errors.price.message}</span>}
              </div>
            </div>

            <div className={styles.field}>
              <label className={cn('eyebrow', styles.label)} htmlFor="wish-image">
                Изображение — ссылка
              </label>
              <input
                id="wish-image"
                className={cn(styles.input, errors.imageUrl && styles.invalid)}
                placeholder="Ссылка на картинку — превью появится справа"
                aria-invalid={errors.imageUrl ? true : undefined}
                {...register('imageUrl')}
              />
              {errors.imageUrl && <span className={styles.error}>{errors.imageUrl.message}</span>}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <span className={cn('eyebrow', styles.label)}>Приоритет</span>
                <div className={styles.priorities} role="radiogroup" aria-label="Приоритет">
                  {PRIORITIES.map((priority) => {
                    const active = values.priority === priority.value;
                    return (
                      <button
                        key={priority.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={cn(styles.priorityPill, active && styles.priorityOn)}
                        onClick={() => {
                          setValue('priority', priority.value, { shouldDirty: true });
                        }}
                      >
                        {priority.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={cn(styles.field, 'flex-1')}>
                <label className={cn('eyebrow', styles.label)} htmlFor="wish-note">
                  Заметка
                </label>
                <textarea
                  id="wish-note"
                  className={styles.textarea}
                  placeholder="Что важно знать дарителю"
                  {...register('note')}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? 'Сохраняем' : 'Сохранить'}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Отмена
              </Button>
              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="danger"
                  className={styles.deleteBtn}
                  onClick={() => {
                    setConfirmDelete(true);
                  }}
                >
                  Удалить
                </Button>
              )}
            </div>
          </div>
        </form>

        <div className={styles.previewCol}>
          <span className={cn('eyebrow', styles.previewLabel)}>так желание встанет в орбиту</span>
          <WishCard wish={preview} variant="portrait" />
        </div>
      </div>

      {confirmDelete && (
        <div
          className={styles.scrim}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className={styles.dialog}>
            <h2 id="delete-title" className={styles.dialogTitle}>
              Удалить желание?
            </h2>
            <p className={styles.dialogText}>
              Оно исчезнет из списка и из орбиты. Если его уже забронировали, гость увидит, что
              подарка больше нет.
            </p>
            <div className={styles.dialogActions}>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete?.();
                }}
              >
                Удалить
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmDelete(false);
                }}
              >
                Оставить
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
