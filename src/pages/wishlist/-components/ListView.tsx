import { useMemo, useState } from 'react';
import { PRIORITY_ORDER, WishCard, type WishPriority, type WishPublic } from '@/entities/wish';
import { EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import styles from './wishlist.module.css';

type PriorityFilter = 'all' | WishPriority;
type StatusFilter = 'all' | 'free' | 'taken';
type Sort = 'priority' | 'price_asc' | 'price_desc';

interface ListViewProps {
  wishes: WishPublic[];
  pendingId?: string;
  onOpen: (wish: WishPublic) => void;
  onToggleReservation: (wish: WishPublic) => void;
}

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'все' },
  { value: 'dream', label: 'мечты' },
  { value: 'want_badly', label: 'очень хочет' },
  { value: 'would_be_nice', label: 'славно' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'любые' },
  { value: 'free', label: 'свободные' },
  { value: 'taken', label: 'занятые' },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: 'priority', label: 'по приоритету' },
  { value: 'price_asc', label: 'дешевле' },
  { value: 'price_desc', label: 'дороже' },
];

export function ListView({ wishes, pendingId, onOpen, onToggleReservation }: ListViewProps) {
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<Sort>('priority');

  const visible = useMemo(() => {
    const filtered = wishes.filter((wish) => {
      if (priority !== 'all' && wish.priority !== priority) {
        return false;
      }
      if (status === 'free' && wish.reservationStatus !== 'free') {
        return false;
      }
      if (status === 'taken' && wish.reservationStatus === 'free') {
        return false;
      }
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'price_asc') {
        return a.price - b.price;
      }
      if (sort === 'price_desc') {
        return b.price - a.price;
      }
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
    return sorted;
  }, [wishes, priority, status, sort]);

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <FilterGroup
            label="Приоритет"
            options={PRIORITY_FILTERS}
            value={priority}
            onChange={setPriority}
          />
          <FilterGroup
            label="Статус"
            options={STATUS_FILTERS}
            value={status}
            onChange={setStatus}
          />
        </div>
        <div className={styles.filters}>
          <FilterGroup label="Сортировка" options={SORTS} value={sort} onChange={setSort} />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          tag="фильтр"
          title="НИЧЕГО НЕ НАШЛОСЬ"
          text="В этом наборе желаний нет. Попробуйте расширить фильтры или снять приоритет."
        />
      ) : (
        <div className={styles.grid}>
          {visible.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              variant="portrait"
              pending={pendingId === wish.id}
              onOpen={() => {
                onOpen(wish);
              }}
              onToggleReservation={() => {
                onToggleReservation(wish);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function FilterGroup<T extends string>({ label, options, value, onChange }: FilterGroupProps<T>) {
  return (
    <div className={styles.filterGroup} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(styles.chip, option.value === value && styles.chipOn)}
          aria-pressed={option.value === value}
          onClick={() => {
            onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
