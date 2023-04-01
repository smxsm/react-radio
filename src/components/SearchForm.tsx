import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchForm.module.css';
import Button from './ui/Button';
import Input from './ui/Input';

type SearchFormProps = {
  className?: string;
};

export default function SearchForm({ className }: SearchFormProps) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const valueChangeHandler = (e: React.FormEvent<HTMLInputElement>) => setValue(e.currentTarget.value);
  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = value.trim();
    if (searchTerm.length < 3) return;

    navigate(`/stations/search/${encodeURIComponent(searchTerm)}`);
    setValue('');
  };

  return (
    <form className={`${styles.searchForm} ${className}`.trim()} onSubmit={submitHandler}>
      <div className={styles.searchInputGroup}>
        <Input
          className={`${styles.input} ${className}`.trim()}
          value={value}
          onChange={valueChangeHandler}
          placeholder="Search..."
        />
        <Button className={styles.btn}>
          <FontAwesomeIcon icon={faSearch} />
        </Button>
      </div>
    </form>
  );
}
