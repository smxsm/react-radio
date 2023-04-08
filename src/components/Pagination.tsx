import { useState } from 'react';
import Button from './ui/Button';
import styles from './Pagination.module.css';

type PaginationProps = {
  pages: number;
  current: number;
  maxVisibleButtons?: number;
  className?: string;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  pages,
  current,
  maxVisibleButtons = 7,
  className,
  onPageChange,
}: PaginationProps) {
  const [active, setActive] = useState(current);

  let btnCount = maxVisibleButtons;
  if (btnCount > pages) {
    btnCount = pages;
  }

  let firstBtn = active - Math.floor(btnCount / 2);
  let lastBtn = firstBtn + btnCount - 1;
  if (firstBtn < 1) {
    firstBtn = 1;
    lastBtn = firstBtn + btnCount - 1;
  }
  if (lastBtn > pages) {
    lastBtn = pages;
    firstBtn = lastBtn - btnCount + 1;
  }

  const buttons = Array.from({ length: lastBtn - firstBtn + 1 }, (_, i) => i + firstBtn);

  const clickHandler = (page: number) => () => {
    let selected = page;
    if (selected < 1) selected = 1;
    if (selected > pages) selected = pages;
    setActive(selected);
    onPageChange(selected);
  };

  return (
    <div className={`${styles.pagination} ${className ? className : ''}`.trim()}>
      <Button type="button" disabled={active === 1} onClick={clickHandler(active - 1)}>
        Previous
      </Button>
      {buttons.map((btn) => (
        <Button
          type="button"
          key={btn}
          active={btn === active}
          className={styles['page-btn']}
          onClick={clickHandler(btn)}
        >
          {btn}
        </Button>
      ))}
      <Button type="button" disabled={active === pages} onClick={clickHandler(active + 1)}>
        Next
      </Button>
    </div>
  );
}
