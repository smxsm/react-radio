import styles from './Button.module.css';

type ButtonProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  loading?: boolean;
  error?: boolean;
  active?: boolean;
};

export default function Button({ loading, error, active = false, className, ...props }: ButtonProps) {
  let classes = `${styles.btn} ${className || ''}`.trim();
  if (loading) {
    classes += ' ' + styles.loading;
  }
  if (error) {
    classes += ' ' + styles.error;
  }
  if (active) {
    classes += ' ' + styles.active;
  }
  return <button {...props} className={classes} />;
}
