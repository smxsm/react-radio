import SearchParamSelect from './SearchParamSelect';
import { useTranslation } from 'react-i18next';

import styles from './CustomStationsListOptions.module.css';

export default function CustomStationsListOptions() {
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  return (
    <div className={styles.options}>
      <SearchParamSelect
        optionsList={[
          [translate('nav.sort.date'), 'created_at'],
          [translate('nav.sort.name'), 'name'],
        ]}
        label={translate('nav.sort')}
        name="sort"
        defaultValue="date"
      />
      <SearchParamSelect
        optionsList={[
          [translate('nav.order.asc'), 'asc'],
          [translate('nav.order.desc'), 'desc'],
        ]}
        label={translate('nav.order')}
        name="order"
        defaultValue="asc"
      />
    </div>
  );
}
