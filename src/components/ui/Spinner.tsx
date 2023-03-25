import styles from './Spinner.module.css';

type SpinnerProps = {
  className?: string;
};

export default function Spinner({ className }: SpinnerProps) {
  return <div className={`${styles.spinner} ${className}`.trim()}></div>;
}
