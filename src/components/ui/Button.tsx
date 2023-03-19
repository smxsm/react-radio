import styles from './Button.module.css';

type ButtonProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  loading?: boolean;
  error?: boolean;
};

export default function Button({ loading, error, className, ...props }: ButtonProps) {
  let classes = `${styles.btn} ${className || ''}`.trim();
  if (loading) {
    classes += ' ' + styles.loading;
  }
  if (error) {
    classes += ' ' + styles.error;
  }
  return <button {...props} className={classes} />;
}
