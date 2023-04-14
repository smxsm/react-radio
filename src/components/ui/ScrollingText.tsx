import { useEffect, useRef, useState } from 'react';

import styles from './ScrollingText.module.css';

type ScrollingTextProps = {
  text: string;
  className?: string;
};

export default function ScrollingText({ text, className }: ScrollingTextProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const timoutRef = useRef<NodeJS.Timer | number>(0);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const div = divRef.current;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    if (div) {
      observer.observe(div);
    }
    return () => {
      div && observer.unobserve(div);
    };
  }, []);

  useEffect(() => {
    const resetAnimation = () => {
      spanRef.current?.classList.remove(styles.scroll);
      void spanRef.current?.offsetWidth;
    };

    clearTimeout(timoutRef.current);
    resetAnimation();

    const textWidth = (spanRef.current && spanRef.current.offsetWidth) || 0;

    if (containerWidth - textWidth >= 0) {
      setShouldScroll(false);
      return;
    }

    setShouldScroll(true);

    const startAnimation = () => {
      timoutRef.current = setTimeout(() => {
        resetAnimation();
        const animationDuration = textWidth / 60;
        spanRef.current!.style.animationDuration = animationDuration.toFixed(2) + 's';
        spanRef.current!.classList.add(styles.scroll);
        spanRef.current!.onanimationend = startAnimation;
      }, 8000);
    };

    startAnimation();

    return () => clearTimeout(timoutRef.current);
  }, [text, containerWidth]);

  return (
    <div ref={divRef} className={styles.container}>
      <span ref={spanRef} className={`${styles.scrollable}${className ? ' ' + className : ''}`} key={text}>
        {text}
        {!shouldScroll ? '' : ' | ' + text + ' | '}
      </span>
    </div>
  );
}
