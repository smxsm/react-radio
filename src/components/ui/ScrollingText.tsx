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
    const resetAnimation = () => {
      span.classList.remove(styles.scroll);
      span.classList.remove(styles['fade-in']);
      void span.offsetWidth;
    };

    clearTimeout(timoutRef.current);
    const div = divRef.current! as HTMLSpanElement;
    const span = spanRef.current! as HTMLSpanElement;
    resetAnimation();
    span.style.animationDuration = '500ms';
    span.classList.add(styles['fade-in']);
    const hidden = div.offsetWidth - span.offsetWidth;

    if (hidden > 0) {
      setShouldScroll(false);
      return;
    }

    setShouldScroll(true);

    const startAnimation = () => {
      timoutRef.current = setTimeout(() => {
        resetAnimation();
        const animationDuration = span.offsetWidth / 60;
        span.style.animationDuration = animationDuration.toFixed(2) + 's';
        span.classList.add(styles.scroll);
        span.addEventListener('animationend', startAnimation);
      }, 8000);
    };

    startAnimation();

    return () => clearTimeout(timoutRef.current);
  }, [text]);

  return (
    <div ref={divRef} className={styles.container}>
      <span ref={spanRef} className={`${styles.scrollable}${className ? ' ' + className : ''}`} key={text}>
        {text}
        {!shouldScroll ? '' : ' | ' + text + ' | '}
      </span>
    </div>
  );
}
