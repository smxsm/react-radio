import { PropsWithChildren } from 'react';
import styles from './CardsList.module.css';

export default function CardsList({ children }: PropsWithChildren) {
  return (
    <ul className={styles['cards-list']}>
      {Array.isArray(children)
        ? children.map((child, i) => <li key={child.key ? child.key : i}>{child}</li>)
        : children}
    </ul>
  );
}
