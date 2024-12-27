import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { z } from 'zod';

import { UserContext } from '../context/UserContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';

import Input from './ui/Input';
import Label from './ui/Label';
import Button from './ui/Button';

import styles from './ForgotPwd.module.css';

const signInDataSchema = z.object({
  email: z.string().trim().email('Invalid e-mail address'),
  password: z.string(),
  remember: z.boolean(),
});

export default function ForgotPwd () {
  const { user, signin, loading } = useContext(UserContext)!;
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signInDataSchema) });
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;


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
        <h2>{translate('user.form.forgotpwdheader')}</h2>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          {translate('user.form.email')}
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error && !loading} disabled={loading}>
            {translate('user.forgotpwdaction')}
          </Button>
        </div>

      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
