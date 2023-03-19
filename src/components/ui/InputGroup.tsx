import { DetailedHTMLProps, forwardRef, InputHTMLAttributes } from 'react';
import Input from './Input';
import styles from './InputGroup.module.css';
import Label from './Label';

type InputGroupProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  label: string;
  name: string;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
};

const InputGroup = forwardRef(({ label, loading, error, disabled, name, ...props }: InputGroupProps, ref: any) => {
  return (
    <>
      <Label htmlFor={name} disabled={disabled}>
        {label}
      </Label>
      <Input type="text" ref={ref} id={name} name={name} disabled={disabled} {...props} />
      <p></p>
      <p>{error && error}</p>
    </>
  );
});

export default InputGroup;
