import { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { UserContext } from '../context/UserContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';

import Input from './ui/Input';
import Label from './ui/Label';
import Button from './ui/Button';

import styles from './SignIn.module.css';

const signInDataSchema = z.object({
  email: z.string().trim().email('Invalid e-mail address'),
  password: z.string(),
  remember: z.boolean(),
});

export default function SignIn() {
  const { user, signin, loading } = useContext(UserContext)!;
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signInDataSchema) });
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle('Sign in');
  }, [setDocumentTitle]);

  const submitHandler = async ({ email, password, remember }: FieldValues) => {
    setError(await signin(email, password, remember));
  };

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <section className={styles['signin-section']}>
      <div className={styles['form-title']}>
        <h2>Sign in to your account</h2>
        <p>
          or
          <Link to="/auth/signup"> create a new account</Link>
        </p>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          E-Mail
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>
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

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error && !loading} disabled={loading}>
            Sign in
          </Button>
        </div>

        <div className={styles['signin-options']}>
          <div className={styles['remember-group']}>
            <Input type="checkbox" id="remember" disabled={loading} defaultChecked={true} {...register('remember')} />
            <Label htmlFor="remember" disabled={loading}>
              Remember me
            </Label>
          </div>
          <Link to="/auth/forgot-password">Forgot your password?</Link>
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
