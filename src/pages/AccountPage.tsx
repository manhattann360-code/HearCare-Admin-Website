import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, errorMessage } from '@/api/client';
import { PageHeader, Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthContext';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Please type your current password.'),
    newPassword: z.string().min(8, 'Your new password must have at least 8 characters.'),
    confirm: z.string().min(1, 'Please type the new password again.'),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'The two passwords are not the same.' })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Your new password must be different from the old one.',
  });
type Values = z.infer<typeof schema>;

export default function AccountPage() {
  const { admin } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    try {
      await api.post('/admin/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword });
      toast.success('Your password has been changed.');
      reset();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="My account" subtitle="Your sign-in details and password." />
      <Card className="mb-6 p-6">
        <div className="text-sm text-ink-soft">Name</div>
        <div className="mb-3 text-lg font-semibold">{admin?.name}</div>
        <div className="text-sm text-ink-soft">Email address</div>
        <div className="text-lg font-semibold">{admin?.email}</div>
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-xl">Change my password</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="Use at least 8 characters. A mix of letters and numbers is best."
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input label="Type the new password again" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" loading={isSubmitting} icon="lock_reset">
            Change password
          </Button>
        </form>
      </Card>
    </div>
  );
}
