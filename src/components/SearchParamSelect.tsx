import { useSearchParams } from 'react-router-dom';
import styles from './SearchParamSelect.module.css';

type SelectOptions = [label: string, value: string];

type SearchParamSelectProps = {
  optionsList: SelectOptions[];
  label: string;
  name: string;
  defaultValue: string;
};

export default function SearchParamSelect({ optionsList, label, name, defaultValue }: SearchParamSelectProps) {
  const [searchParams, setSearchParams] = useSearchParams(new URLSearchParams({ [name]: defaultValue }));

  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <select
        name={name}
        id={name}
        value={searchParams.get(name) || ''}
        onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams.entries()), [name]: e.target.value })}
        className={styles.select}
      >
        {optionsList.map(([label, value]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
