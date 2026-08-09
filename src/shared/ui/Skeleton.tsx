import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/** Shimmering placeholder used while data loads. */
export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn(styles.skeleton, className)} style={style} aria-hidden="true" />;
}
