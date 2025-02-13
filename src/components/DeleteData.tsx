import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../context/UserContext';

import { DocumentTitleContext } from '../context/DocumentTitleContext';
import { deleteDataNow } from '../lib/api';

import Button from './ui/Button';

import styles from './DeleteData.module.css';

export default function DeleteData () {
  const { t } = useTranslation();
  const { user, signout } = useContext(UserContext)!;
  const translate = t as (key: string) => string;
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { handleSubmit } = useForm({ 
    mode: 'onTouched', 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | Error>(null);
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle(translate('user.requestdeleteaction'));
  }, [setDocumentTitle, translate]);

  const submitHandler = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteDataNow(token);
      if (user)  {
        await signout();
      }
      navigate('/', { replace: true });
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
        <h2>{translate('user.form.confirmdeleteheader')}</h2>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error && !loading} disabled={loading}>
            {translate('user.confirmdeleteaction')}
          </Button>
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error.message}</p>}
    </section>
  );
}
