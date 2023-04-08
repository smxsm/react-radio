import { Link } from 'react-router-dom';

import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <h1 className={styles.statusCode}>404</h1>
        <h2 className={styles.title}>This page could not be found.</h2>
        <Link to="/" className={styles.link}>
          Click here to go to the homepage
        </Link>
      </header>
    </article>
  );
}
