import { PropsWithChildren } from 'react';
import styles from './Menu.module.css';

type MenuProps = PropsWithChildren & {
  className?: string;
};

export function Menu({ children, className }: MenuProps) {
  return (
    <ul className={`${styles.menu} ${className}`.trim()}>
      {Array.isArray(children) ? children?.map((child, i) => <li key={i}>{child}</li>) : children}
    </ul>
  );
}
