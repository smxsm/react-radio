import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, LegacyRef } from 'react';
import styles from './Input.module.css';

type InputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  loading?: boolean;
  error?: boolean;
};

const Input = forwardRef(
  ({ loading, error, className, ...props }: InputProps, ref: LegacyRef<HTMLInputElement> | undefined) => {
    let classes = `${styles.input} ${className || ''}`.trim();
    if (loading) {
      classes += ' ' + styles.loading;
    }
    if (error) {
      classes += ' ' + styles.error;
    }
    return <input {...props} ref={ref} className={classes} />;
  }
);

export default Input;
