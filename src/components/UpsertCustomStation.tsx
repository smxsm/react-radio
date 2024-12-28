import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

import useCustomStations from '../hooks/useCustomStations';

import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';

import styles from './UpsertCustomStation.module.css';

const customStationValues = z.object({
  name: z.string().min(1, 'Station name is required').max(30, 'Station name cannot be longer than 30 characters'),
  logo: z.string().url('Invalid URL'),
  listenUrl: z.string().url('Invalid URL'),
});

export default function UpsertCustomStation() {
  const { id } = useParams();
  const { loading, error, getCustomStations, addCustomStation, stations } = useCustomStations();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const { register, handleSubmit, formState, setValue } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(customStationValues),
  });

  useEffect(() => {
    if (!id) return;

    getCustomStations(id);
  }, [id, getCustomStations]);

  useEffect(() => {
    if (!stations.length) return;

    const { name, logo, listenUrl } = stations[0];
    setValue('name', name);
    setValue('logo', logo);
    setValue('listenUrl', listenUrl);
  }, [stations, setValue]);

  const submitHandler = (values: FieldValues) => {
    addCustomStation({ ...values, id } as RadioStation).then((result) => {
      if (result) {
        navigate('/stations/custom');
      }
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.formTitle}>
        {!id && <h2>{translate('stations.add')}</h2>}
        {id && <h2>{translate('stations.edit')}</h2>}
        {error && <p>{error.message}</p>}
      </div>

      <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="name" disabled={loading}>
          Name
        </Label>
        <Input type="text" id="name" {...register('name')} error={!!formState.errors.name} disabled={loading} />
        <p className={styles.validationError}>{formState.errors['name']?.message as string}</p>
        <Label htmlFor="logo" disabled={loading}>
          Logo URL
        </Label>
        <Input type="text" id="logo" {...register('logo')} error={!!formState.errors.logo} disabled={loading} />
        <p className={styles.validationError}>{formState.errors['logo']?.message as string}</p>
        <Label htmlFor="listenUrl" disabled={loading}>
          Listen URL
        </Label>
        <Input
          type="text"
          id="listenUrl"
          {...register('listenUrl')}
          error={!!formState.errors.listenUrl}
          disabled={loading}
        />
        <p className={styles.validationError}>{formState.errors['listenUrl']?.message as string}</p>

        <div className={styles.formActions}>
          <Button type="button" disabled={loading} onClick={() => navigate(-1)}>
            {translate('stations.cancelaction')}
          </Button>
          <Button type="submit" loading={loading} error={!!error} disabled={loading}>
            {id ? translate('stations.confirmaction') : translate('stations.addaction')}
          </Button>
        </div>
      </form>
    </section>
  );
}
