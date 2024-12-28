import { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { UserContext } from '../context/UserContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';

import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';

import styles from './SignUp.module.css';


export default function SignUp() {
  const { user, signup, loading } = useContext(UserContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const signUpDataSchema = z
    .object({
      email: z.string().trim().email(translate('errors.email.invalid')),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      password: z.string()
        .min(14, translate('errors.password.minlen'))
        .regex(/[A-Z]/, translate('errors.password.uppercase'))
        .regex(/[!@#$%^&*(),.?":{}|<>_]/, translate('errors.password.specialchar')),
      confirmPassword: z.string(),
      rePass: z.string(),
    })
    .refine((data) => data.password === data.rePass, { message: translate('errors.password.nomatch'), path: ['rePass'] });
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signUpDataSchema) });
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle('Sign up');
  }, [setDocumentTitle]);

  const submitHandler = async ({ email, firstName, lastName, password }: FieldValues) => {
    setError(await signup(email, firstName, lastName, password));
  };

  if (user) return <Navigate to="/" />;

  return (
    <section className={styles['signup-section']}>
      <div className={styles['form-title']}>
        <h2>{translate('user.form.account.create')}</h2>
        <p>
          <Trans i18nKey='user.form.loginaction'>
            or <Link to="/auth/signin"> sign in here</Link>
          </Trans>
        </p>
      </div>

      <form className={styles['signup-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          {translate('user.form.account.email')}
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>

        <Label htmlFor="firstName" disabled={loading}>
          {translate('user.form.account.firstname')}
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
          {translate('user.form.account.lastname')}
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
          {translate('user.form.account.password')}
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
          {translate('user.form.account.password2')}
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
            {translate('user.form.account.createaction')}
          </Button>
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
