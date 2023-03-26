import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchForm.module.css';
import Button from './ui/Button';
import Input from './ui/Input';

export default function SearchForm() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const valueChangeHandler = (e: React.FormEvent<HTMLInputElement>) => setValue(e.currentTarget.value);
  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    navigate(`/stations/search/${encodeURIComponent(value)}`);
    setValue('');
  };

  return (
    <form className={styles.searchForm} onSubmit={submitHandler}>
      <Input className={styles.input} value={value} onChange={valueChangeHandler} placeholder="Search..."></Input>
      <Button className={styles.btn}>
        <FontAwesomeIcon icon={faSearch} />
      </Button>
    </form>
  );
}
