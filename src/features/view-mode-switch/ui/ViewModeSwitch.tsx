import { cn } from '@/shared/lib/cn';
import type { ViewMode } from '../model/use-view-mode';
import styles from './ViewModeSwitch.module.css';

interface ViewModeSwitchProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'orbit', label: 'Орбита' },
  { value: 'list', label: 'Список' },
];

export function ViewModeSwitch({ mode, onChange }: ViewModeSwitchProps) {
  return (
    <div className={styles.switch} role="group" aria-label="Режим отображения">
      {OPTIONS.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(styles.option, active && styles.active)}
            aria-pressed={active}
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
