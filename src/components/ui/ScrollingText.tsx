import { useEffect, useRef, useState } from 'react';

import styles from './ScrollingText.module.css';

type ScrollingTextProps = {
  text: string;
  className?: string;
};

export default function ScrollingText({ text, className }: ScrollingTextProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const scrollableRef = useRef<HTMLSpanElement | null>(null);
  const textSpanRef = useRef<HTMLSpanElement | null>(null);
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
      scrollableRef.current?.classList.remove(styles.scroll);
      void scrollableRef.current?.offsetWidth;
    };

    clearTimeout(timoutRef.current);
    resetAnimation();

    const textWidth = (textSpanRef.current && textSpanRef.current.offsetWidth) || 0;

    if (containerWidth - textWidth >= 0) {
      setShouldScroll(false);
      return;
    }

    setShouldScroll(true);

    const startAnimation = () => {
      timoutRef.current = setTimeout(() => {
        resetAnimation();
        const animationDuration = textWidth / 60;
        scrollableRef.current!.style.animationDuration = animationDuration.toFixed(2) + 's';
        scrollableRef.current!.classList.add(styles.scroll);
        scrollableRef.current!.onanimationend = startAnimation;
      }, 8000);
    };

    startAnimation();

    return () => clearTimeout(timoutRef.current);
  }, [text, containerWidth]);

  return (
    <div ref={divRef} className={styles.container}>
      <span ref={scrollableRef} className={`${styles.scrollable}${className ? ' ' + className : ''}`} key={text}>
        <span ref={textSpanRef}>{text}</span>
        {!shouldScroll ? '' : ' | ' + text + ' | '}
      </span>
    </div>
  );
}
