import { useState, type ReactNode } from 'react';
import {
  formatPrice,
  priorityLabel,
  useAdminWishes,
  useDeleteWish,
  useSaveWish,
  type WishAdmin,
  type WishDraft,
} from '@/entities/wish';
import { WishForm } from '@/features/wish-form';
import { Button, EmptyState, LiquidBackdrop, Skeleton, TopBar } from '@/shared/ui';
import styles from './admin.module.css';

// NOTE: `WishAdmin` has no reservation fields at the type level, so nothing on
// this screen can render who reserved what — the privacy rule is enforced by types.

type Editing = { mode: 'create' } | { mode: 'edit'; wish: WishAdmin } | null;

export function AdminScreen({ slug }: { slug: string }) {
  const query = useAdminWishes(slug);
  const save = useSaveWish(slug);
  const remove = useDeleteWish(slug);
  const [editing, setEditing] = useState<Editing>(null);

  const wishes = query.data ?? [];

  if (editing) {
    const isEdit = editing.mode === 'edit';
    const submit = (draft: WishDraft) => {
      save.mutate(
        { id: isEdit ? editing.wish.id : undefined, draft },
        { onSuccess: () => setEditing(null) },
      );
    };
    return (
      <Shell>
        <div className={styles.formHead}>
          <span className={`eyebrow ${styles.formMode}`}>
            {isEdit ? 'редактирование желания' : 'новое желание'}
          </span>
        </div>
        <h1 className={styles.formTitle}>{isEdit ? 'ПРАВИМ ЖЕЛАНИЕ' : 'НОВОЕ ЖЕЛАНИЕ'}</h1>
        <WishForm
          mode={isEdit ? 'edit' : 'create'}
          initialWish={isEdit ? editing.wish : undefined}
          saving={save.isPending}
          onSubmit={submit}
          onCancel={() => {
            setEditing(null);
          }}
          onDelete={
            isEdit
              ? () => {
                  remove.mutate(editing.wish.id, { onSuccess: () => setEditing(null) });
                }
              : undefined
          }
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={styles.layout}>
        <div className={styles.left}>
          <h1 className={styles.title}>МОИ ЖЕЛАНИЯ</h1>
          <div className={styles.privacy}>
            <h2 className={styles.privacyTitle}>Часть желаний уже разобрана</h2>
            <p className={styles.privacyText}>
              Мы не покажем, что именно и кем. Незнание — часть подарка: до последнего дня список
              остаётся списком желаний, а не отчётом о покупках.
            </p>
          </div>
          <Button
            variant="secondary"
            className={styles.addBtn}
            onClick={() => {
              setEditing({ mode: 'create' });
            }}
          >
            Добавить желание
          </Button>
        </div>

        <div className={styles.right}>
          {query.isPending ? (
            Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} style={{ height: 78, borderRadius: 18 }} />
            ))
          ) : wishes.length === 0 ? (
            <EmptyState
              tag="вишлист владельца"
              title="ПОКА ПУСТО"
              text="Первое желание задаёт тон всему списку. Начните с того, что просите уже второй год."
            />
          ) : (
            wishes.map((wish) => (
              <div key={wish.id} className={styles.row}>
                <div className={styles.thumb}>
                  {wish.imageUrl && <img src={wish.imageUrl} alt="" />}
                </div>
                <div className={styles.rowBody}>
                  <h3 className={styles.rowName}>{wish.title}</h3>
                  <span className={`eyebrow ${styles.rowEyebrow}`}>
                    {priorityLabel(wish.priority)}
                  </span>
                </div>
                <span className={styles.rowPrice}>{formatPrice(wish.price, wish.currency)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing({ mode: 'edit', wish });
                  }}
                >
                  Изменить
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.screen}>
      <LiquidBackdrop />
      <TopBar>
        <span className="eyebrow" style={{ color: 'var(--color-ink-muted)' }}>
          мой список · 14 сентября
        </span>
      </TopBar>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
