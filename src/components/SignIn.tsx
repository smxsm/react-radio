import { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useTranslation } from 'react-i18next';

import { z } from 'zod';

import { UserContext } from '../context/UserContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';

import Input from './ui/Input';
import Label from './ui/Label';
import Button from './ui/Button';

import styles from './SignIn.module.css';

export default function SignIn() {
  const { user, signin, loading } = useContext(UserContext)!;
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const signInDataSchema = z.object({
    email: z.string().trim().email(translate('errors.email.invalid')),
    password: z.string(),
    remember: z.boolean(),
  });
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signInDataSchema) });

  useEffect(() => {
    setDocumentTitle(translate('user.signin'));
  }, [setDocumentTitle, translate]);

  const submitHandler = async ({ email, password, remember }: FieldValues) => {
    setError(await signin(email, password, remember));
  };

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <section className={styles['signin-section']}>
      <div className={styles['form-title']}>
        <h2>{translate('user.form.signinheader')}</h2>
        <p>
          <Trans i18nKey='user.form.signinaction'>
            or <Link to="/auth/signup"> create a new account</Link>
          </Trans>
        </p>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          {translate('user.form.email')}
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>
        <Label htmlFor="password" disabled={loading}>
          {translate('user.form.password')}
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
            {translate('user.signin')}
          </Button>
        </div>

        <div className={styles['signin-options']}>
          <div className={styles['remember-group']}>
            <Input type="checkbox" id="remember" disabled={loading} defaultChecked={true} {...register('remember')} />
            <Label htmlFor="remember" disabled={loading}>
              {translate('user.form.rememberme')}
            </Label>
          </div>
          <Trans i18nKey='user.form.forgotpwd'>
            <Link to="/auth/forgot-password">Forgot your password?</Link>
          </Trans>
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
