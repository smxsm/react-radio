import { PropsWithChildren } from 'react';
import styles from './CardsList.module.css';

type CardsListPorps = PropsWithChildren & {
  className?: string;
};

export default function CardsList({ children, className }: CardsListPorps) {
  return (
    <ul className={`${styles['cards-list']} ${className}`.trim()}>
      {Array.isArray(children)
        ? children.map((child, i) => <li key={child.key ? child.key : i}>{child}</li>)
        : children}
    </ul>
  );
}
