import { DetailedHTMLProps, LabelHTMLAttributes } from 'react';
import styles from './Label.module.css';

type LabelProps = DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement> & {
  disabled?: boolean;
};

export default function Label({ disabled, className, ...props }: LabelProps) {
  let classes = `${styles.label} ${className || ''}`.trim();
  if (disabled) {
    classes += ' ' + styles.disabled;
  }
  return (
    <label {...props} className={classes}>
      {props.children}
    </label>
  );
}
