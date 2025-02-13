import { useContext, useEffect, useState } from 'react';
//import { Navigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { z } from 'zod';

//import { UserContext } from '../context/UserContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';
import { requestDelete } from '../lib/api';

import Input from './ui/Input';
import Label from './ui/Label';
import Button from './ui/Button';

import styles from './RequestDelete.module.css';

const forgotPwdSchema = z.object({
  email: z.string().trim().email('Invalid e-mail address'),
});

export default function RequestDelete() {
  //const { user } = useContext(UserContext)!;
  const { register, handleSubmit, formState } = useForm({ 
    mode: 'onTouched', 
    resolver: zodResolver(forgotPwdSchema) 
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;

  useEffect(() => {
    setDocumentTitle(translate('user.forgotpwd'));
  }, [setDocumentTitle, translate]);

  const submitHandler = async ({ email }: FieldValues) => {
    setLoading(true);
    setError(null);
    try {
      await requestDelete(email);
      setSuccess(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className={styles['signin-section']}>
        <div className={styles['form-title']}>
          <h2>{translate('user.form.forgotpwdsuccess')}</h2>
        </div>
        <p>{translate('user.form.requestdeletesuccessmsg')}</p>
      </section>
    );
  }

  return (
    <section className={styles['signin-section']}>
      <div className={styles['form-title']}>
        <h2>{translate('user.form.requestdeleteheader')}</h2>

        <p>{translate('user.form.requestdeletetext')}</p>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          {translate('user.form.email')}
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error && !loading} disabled={loading}>
            {translate('user.requestdeleteaction')}
          </Button>
        </div>

      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
