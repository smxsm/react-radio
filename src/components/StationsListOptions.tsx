import SearchParamSelect from './SearchParamSelect';
import { useTranslation } from 'react-i18next';

import styles from './StationsListOptions.module.css';

export default function StationsListOptions() {
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  return (
    <div className={styles.options}>
      <SearchParamSelect
        optionsList={[
          [translate('nav.sort.name'), 'name'],
          [translate('nav.sort.popular'), 'popularity'],
          [translate('nav.sort.trending'), 'trending'],
        ]}
        label={translate('nav.sort')}
        name="sort"
        defaultValue="popularity"
      />
      <SearchParamSelect
        optionsList={[
          [translate('nav.order.asc'), 'asc'],
          [translate('nav.order.desc'), 'desc'],
        ]}
        label={translate('nav.order')}
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
        label={translate('nav.limit')}
        name="limit"
        defaultValue="40"
      />
      <SearchParamSelect
        optionsList={[
          [translate ('nav.distance.all'), '-1'],
          ['10 km', '10'],
          ['50 km', '50'],
          ['100 km', '100'],
          ['500 km', '500'],
          ['1000 km', '1000'],
        ]}
        label={translate('nav.distance')}
        name="distance"
        defaultValue="-1"
      />
    </div>
  );
}
