import styles from './SignIn.module.css';
import { useContext, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Input from './ui/Input';
import Label from './ui/Label';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faApple, faFacebookF, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { UserContext } from '../context/UserContext';
import { z } from 'zod';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

const signInDataSchema = z.object({
  email: z.string().trim().email('Invalid e-mail address'),
  password: z.string(),
  remember: z.boolean(),
});

export default function SignIn() {
  const { user, signin, loading, error } = useContext(UserContext)!;
  const { register, handleSubmit, formState } = useForm({ mode: 'onTouched', resolver: zodResolver(signInDataSchema) });
  const [signingIn, setSigningIn] = useState(false);

  const submitHandler = ({ email, password, remember }: FieldValues) => {
    setSigningIn(true);
    signin(email, password, remember);
  };

  if (user) return <Navigate to="/" />;

  if (!user && loading && !signingIn) return <Spinner className={styles.spinner} />;

  return (
    <section className={styles['signin-section']}>
      <div className={styles['form-title']}>
        <h2>Sign in to your account</h2>
        <p>
          or
          <Link to="/auth/signup"> create a new account</Link>
        </p>
      </div>

      <form className={styles['signin-form']} onSubmit={handleSubmit(submitHandler)}>
        <Label htmlFor="email" disabled={loading}>
          E-Mail
        </Label>
        <Input type="email" id="email" {...register('email')} error={!!formState.errors.email} disabled={loading} />
        <p className={styles['validation-error']}>{formState.errors['email']?.message as string}</p>
        <Label htmlFor="password" disabled={loading}>
          Password
        </Label>
        <Input
          type="password"
          id="password"
          {...register('password')}
          error={!!formState.errors.password}
          disabled={loading}
        />
        <p className={styles['validation-error']}>{formState.errors['password']?.message as string}</p>

        <div className={styles['form-actions']}>
          <Button type="submit" loading={loading} error={!!error} disabled={loading}>
            Sign in
          </Button>
        </div>

        <div className={styles['signin-options']}>
          <div className={styles['remember-group']}>
            <Input type="checkbox" id="remember" disabled={loading} defaultChecked={true} {...register('remember')} />
            <Label htmlFor="remember" disabled={loading}>
              Remember me
            </Label>
          </div>
          <Link to="/auth/forgot-password">Forgot your password?</Link>
        </div>
      </form>

      {/* <div className={styles['hr-label']}>
        <span>or</span>
      </div>

      <Button type="button" className={styles['btn-signin-provider']}>
        <FontAwesomeIcon icon={faApple} className={styles['signin-provider-logo']} />
        <span>Sign in with Apple</span>
      </Button>
      <Button type="button" className={styles['btn-signin-provider']}>
        <FontAwesomeIcon icon={faGoogle} className={styles['signin-provider-logo']} />
        <span>Sign in with Google</span>
      </Button>
      <Button type="button" className={styles['btn-signin-provider']}>
        <FontAwesomeIcon icon={faFacebookF} className={styles['signin-provider-logo']} />
        <span>Sign in with Facebook</span>
      </Button> */}
    </section>
  );
}
