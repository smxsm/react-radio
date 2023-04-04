import { zodResolver } from '@hookform/resolvers/zod';
import { useContext } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { UserContext } from '../context/UserContext';
import styles from './SignUp.module.css';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';

const signUpDataSchema = z.object({
  email: z.string().trim().email('Invalid e-mail address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(6, 'The password must be at least 6 character long'),
  rePass: z.string(),
});

export default function SignUp() {
  const { user, signup, loading, error } = useContext(UserContext)!;
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signUpDataSchema) });

  const submitHandler = ({ email, firstName, lastName, password }: FieldValues) => {
    signup(email, firstName, lastName, password);
  };

  if (user) return <Navigate to="/" />;

  return (
    <section className={styles['signup-section']}>
      <div className={styles['form-title']}>
        <h2>Create a new account</h2>
        <p>
          or
          <Link to="/auth/signin"> sign in here</Link>
        </p>
      </div>

      <form className={styles['signup-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          E-Mail
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>

        <Label htmlFor="firstName" disabled={loading}>
          First name
        </Label>
        <Input
          type="text"
          id="firstName"
          {...register('firstName')}
          error={!!formState.errors.firstName}
          disabled={loading}
        />
        <p className={styles['validation-error']}>{formState.errors['firstName']?.message as string}</p>

        <Label htmlFor="lastName" disabled={loading}>
          Last name
        </Label>
        <Input
          type="text"
          id="lastName"
          {...register('lastName')}
          error={!!formState.errors.lastName}
          disabled={loading}
        />
        <p className={styles['validation-error']}>{formState.errors['lastName']?.message as string}</p>

        <Label htmlFor="password" disabled={loading}>
          Password
        </Label>
        <Input
          type="password"
          id="password"
          {...register('password')}
          error={!!formState.errors.password}
          disabled={loading}
        />
        <p className={styles['validation-error']}>{formState.errors['password']?.message as string}</p>

        <Label htmlFor="repass" disabled={loading}>
          Confirm password
        </Label>
        <Input
          type="password"
          id="rePass"
          {...register('rePass')}
          error={!!formState.errors.rePass}
          disabled={loading}
        />
        <p className={styles['validation-error']}>{formState.errors['rePass']?.message as string}</p>

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error && !loading} disabled={loading}>
            Create account
          </Button>
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
