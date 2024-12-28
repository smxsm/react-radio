import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './NotFound.module.css';

export default function NotFound() {
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <h1 className={styles.statusCode}>404</h1>
        <h2 className={styles.title}>{translate('errors.404.message')}</h2>
        <Link to="/" className={styles.link}>
          {translate('errors.404.home')}
        </Link>
      </header>
    </article>
  );
}
