import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FieldValues } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import useCustomStations, { CustomStation } from '../hooks/useCustomStations';

import styles from './AddCustomStation.module.css';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';

const customStationValues = z.object({
  name: z.string().min(1, 'Station name is required').max(30, 'Station name cannot be longer than 30 characters'),
  logo: z.string().url('Invalid URL'),
  listenUrl: z.string().url('Invalid URL'),
});

export default function AddCustomStation() {
  const { loading, error, addCustomStation } = useCustomStations();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(customStationValues),
  });

  const submitHandler = (values: FieldValues) => {
    addCustomStation(values as CustomStation).then((result) => {
      if (result) {
        navigate('/stations/custom');
      }
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.formTitle}>
        <h2>Add your station</h2>
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
          <Button type="submit" loading={loading} error={!!error} disabled={loading}>
            Add
          </Button>
        </div>
      </form>
    </section>
  );
}
