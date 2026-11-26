import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Pill';
import { errorMessage } from '@/api/client';

const schema = z.object({
  email: z.string().trim().min(1, 'Please type your email address.').email('That does not look like an email address. Example: name@clinic.com'),
  password: z.string().min(1, 'Please type your password.'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: string } | null)?.from || '/';
  if (admin) return <Navigate to={from} replace />;

  const onSubmit = async (v: Values) => {
    setError('');
    try {
      await login(v.email, v.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(errorMessage(e).includes('reach') ? errorMessage(e) : 'The email or password is not right. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-soft to-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-3 text-3xl">HearCare Admin</h1>
          <p className="mt-1 text-ink-soft">Sign in to manage articles, audiologists and appointments.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
          {error && <Notice tone="error">{error}</Notice>}
          <Input label="Email address" type="email" autoComplete="username" autoFocus error={errors.email?.message} {...register('email')} />
          <div>
            <Input
              label="Password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="h-5 w-5" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Show password
            </label>
          </div>
          <Button type="submit" full loading={isSubmitting} icon="login">
            Sign in
          </Button>
          <p className="text-center text-sm text-ink-soft">Forgot your password? Ask another HearCare admin to add you again.</p>
        </form>
      </div>
    </div>
  );
}
