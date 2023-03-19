import { zodResolver } from '@hookform/resolvers/zod';
import { useContext, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { UserContext } from '../context/UserContext';
import styles from './SignUp.module.css';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';

const signUpDataSchema = z.object({
  email: z.string().trim().email('Invalid e-mail address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(6, 'The password must be at least 6 character long'),
  rePass: z.string(),
});

export default function SignUp() {
  const { signup } = useContext(UserContext)!;
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signUpDataSchema) });
  const [status, setStatus] = useState<'' | 'error' | 'loading'>('');
  const navigate = useNavigate();

  const submitHandler = async ({ email, firstName, lastName, password }: FieldValues) => {
    setStatus('loading');
    try {
      await signup(email, firstName, lastName, password).then(() => {
        navigate('/');
      });
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section className={styles['signup-section']}>
      <div className={styles['form-title']}>
        <h2>Create a new account</h2>
        <p>
          or
          <Link to="/auth/signin"> sign in here</Link>
        </p>
      </div>

      <form className={styles['signup-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={status === 'loading'}>
          E-Mail
        </Label>
        <Input
          type="email"
          id="email"
          {...register('email')}
          error={!!formState.errors.email}
          disabled={status === 'loading'}
        />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>

        <Label htmlFor="firstName" disabled={status === 'loading'}>
          First name
        </Label>
        <Input
          type="text"
          id="firstName"
          {...register('firstName')}
          error={!!formState.errors.firstName}
          disabled={status === 'loading'}
        />
        <p className={styles['validation-error']}>{formState.errors['firstName']?.message as string}</p>

        <Label htmlFor="lastName" disabled={status === 'loading'}>
          Last name
        </Label>
        <Input
          type="text"
          id="lastName"
          {...register('lastName')}
          error={!!formState.errors.lastName}
          disabled={status === 'loading'}
        />
        <p className={styles['validation-error']}>{formState.errors['lastName']?.message as string}</p>

        <Label htmlFor="password" disabled={status === 'loading'}>
          Password
        </Label>
        <Input
          type="password"
          id="password"
          {...register('password')}
          error={!!formState.errors.password}
          disabled={status === 'loading'}
        />
        <p className={styles['validation-error']}>{formState.errors['password']?.message as string}</p>

        <Label htmlFor="repass" disabled={status === 'loading'}>
          Confirm password
        </Label>
        <Input
          type="password"
          id="rePass"
          {...register('rePass')}
          error={!!formState.errors.rePass}
          disabled={status === 'loading'}
        />
        <p className={styles['validation-error']}>{formState.errors['rePass']?.message as string}</p>

        <div className={styles['form-actions']}>
          <Button
            type="submit"
            loading={status === 'loading'}
            error={status === 'error'}
            disabled={status === 'loading'}
          >
            Create account
          </Button>
        </div>
      </form>
    </section>
  );
}
