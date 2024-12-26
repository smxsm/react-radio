import SearchParamSelect from './SearchParamSelect';

import styles from './StationsListOptions.module.css';

export default function StationsListOptions() {
  return (
    <div className={styles.options}>
      <SearchParamSelect
        optionsList={[
          ['Name', 'name'],
          ['Popular', 'popularity'],
          ['Trending', 'trending'],
        ]}
        label="Sort"
        name="sort"
        defaultValue="popularity"
      />
      <SearchParamSelect
        optionsList={[
          ['Ascending', 'asc'],
          ['Descending', 'desc'],
        ]}
        label="Order"
        name="order"
        defaultValue="desc"
      />
      <SearchParamSelect
        optionsList={[
          ['40', '40'],
          ['60', '60'],
          ['80', '80'],
          ['100', '100'],
        ]}
        label="Limit"
        name="limit"
        defaultValue="40"
      />
      <SearchParamSelect
        optionsList={[
          ['All', '-1'],
          ['10 km', '10'],
          ['50 km', '50'],
          ['100 km', '100'],
          ['500 km', '500'],
          ['1000 km', '1000'],
        ]}
        label="Distance"
        name="distance"
        defaultValue="-1"
      />
    </div>
  );
}
