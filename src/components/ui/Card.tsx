import { MouseEventHandler, PropsWithChildren } from 'react';
import styles from './Card.module.css';

type CardProps = PropsWithChildren & {
  active?: boolean;
  loading?: boolean;
  error?: boolean;
  className?: string;
  onClick?: MouseEventHandler;
};

export default function Card({
  active = false,
  loading = false,
  error = false,
  className,
  children,
  onClick,
}: CardProps) {
  let classes = styles.card;
  if (active) classes += ' ' + styles.active;
  if (loading) classes += ' ' + styles.loading;
  if (error) classes += ' ' + styles.error;
  if (className) {
    classes += ' ' + className;
  }

  return (
    <article className={classes} onClick={onClick}>
      {children}
    </article>
  );
}
