import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { DocumentTitleContext } from '../context/DocumentTitleContext';
import { resetPassword } from '../lib/api';

import Input from './ui/Input';
import Label from './ui/Label';
import Button from './ui/Button';

import styles from './ForgotPwd.module.css';

export default function ChangePwd() {
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const changePwdSchema = z.object({
    password: z.string()
      .min(14, translate('errors.password.minlen'))
      .regex(/[A-Z]/, translate('errors.password.uppercase'))
      .regex(/[!@#$%^&*(),.?":{}|<>_]/, translate('errors.password.specialchar')),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: translate('errors.password.nomatch'),
    path: ["confirmPassword"],
  });
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm({ 
    mode: 'onTouched', 
    resolver: zodResolver(changePwdSchema) 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle(translate('user.changepwd'));
  }, [setDocumentTitle, translate]);

  const submitHandler = async ({ password }: FieldValues) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      navigate('/auth/signin', { replace: true });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/" />;
  }

  return (
    <section className={styles['signin-section']}>
      <div className={styles['form-title']}>
        <h2>{translate('user.form.changepwdheader')}</h2>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="password" disabled={loading}>
          {translate('user.form.newpassword')}
        </Label>
        <Input 
          type="password" 
          id="password" 
          {...register('password')} 
          error={!!formState.errors.password} 
          disabled={loading} 
        />
        <p className={styles['validation-error']}>
          {formState.errors['password']?.message as string}
        </p>

        <Label htmlFor="confirmPassword" disabled={loading}>
          {translate('user.form.confirmpassword')}
        </Label>
        <Input 
          type="password" 
          id="confirmPassword" 
          {...register('confirmPassword')} 
          error={!!formState.errors.confirmPassword} 
          disabled={loading} 
        />
        <p className={styles['validation-error']}>
          {formState.errors['confirmPassword']?.message as string}
        </p>

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error && !loading} disabled={loading}>
            {translate('user.changepwdaction')}
          </Button>
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
