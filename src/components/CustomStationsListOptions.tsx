import SearchParamSelect from './SearchParamSelect';

import styles from './CustomStationsListOptions.module.css';

export default function CustomStationsListOptions() {
  return (
    <div className={styles.options}>
      <SearchParamSelect
        optionsList={[
          ['Date added', 'created_at'],
          ['Name', 'name'],
        ]}
        label="Sort"
        name="sort"
        defaultValue="date"
      />
      <SearchParamSelect
        optionsList={[
          ['Ascending', 'asc'],
          ['Descending', 'desc'],
        ]}
        label="Order"
        name="order"
        defaultValue="asc"
      />
    </div>
  );
}
