import { useEffect, useRef, useState } from 'react';

import styles from './ScrollingText.module.css';

type ScrollingTextProps = {
  text: string;
  className?: string;
};

export default function ScrollingText({ text, className }: ScrollingTextProps) {
  const divRef = useRef(null);
  const spanRef = useRef(null);
  const timoutRef = useRef<NodeJS.Timer | number>(0);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    clearTimeout(timoutRef.current);
    const div = divRef.current! as HTMLSpanElement;
    const span = spanRef.current! as HTMLSpanElement;
    span.classList.remove(styles.scroll);
    void span.offsetWidth;
    const hidden = div.offsetWidth - span.offsetWidth;

    if (hidden > 0) {
      setShouldScroll(false);
      return;
    }

    const animationDuration = span.offsetWidth / 60;
    span.style.animationDuration = animationDuration.toFixed(2) + 's';
    setShouldScroll(true);

    const startAnimation = () => {
      timoutRef.current = setTimeout(() => {
        span.classList.remove(styles.scroll);
        void span.offsetWidth;
        span.classList.add(styles.scroll);
        span.addEventListener('animationend', startAnimation);
      }, 8000);
    };

    startAnimation();

    return () => clearTimeout(timoutRef.current);
  }, [text]);

  return (
    <div ref={divRef} className={styles.container}>
      <span ref={spanRef} className={`${styles.scrollable}${className ? ' ' + className : ''}`}>
        {text}
        {!shouldScroll ? '' : ' | ' + text + ' | '}
      </span>
    </div>
  );
}
