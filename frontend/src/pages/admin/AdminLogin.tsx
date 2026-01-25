import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { adminLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

function AdminLogin() {
  const { login: setToken } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  const mutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => setToken(data.token)
  });

  const onSubmit = (form: LoginForm) => {
    mutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary">
      <Helmet>
        <title>Admin Login — Luxia</title>
      </Helmet>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-6 rounded-3xl bg-bg-elevated/80 border border-border-default/40 p-8 shadow-2xl backdrop-blur"
      >
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase tracking-[0.4em] text-text-primary">Admin</h1>
          <p className="mt-2 text-sm text-text-secondary">Sign in to manage products and orders.</p>
        </div>
        <div>
          <label htmlFor="admin-email" className="block text-sm font-semibold uppercase tracking-[0.3em] text-text-secondary">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'admin-email-error' : undefined}
            className={`mt-2 w-full rounded-full border-2 px-4 py-3 text-text-primary bg-bg-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.email
                ? 'border-error bg-error/10 focus:border-error focus:ring-error/50'
                : 'border-[rgba(255,255,255,0.5)] focus:border-primary focus:ring-primary/50'
            }`}
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && (
            <p id="admin-email-error" className="mt-1 text-xs text-error">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="admin-password" className="block text-sm font-semibold uppercase tracking-[0.3em] text-text-secondary">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'admin-password-error' : undefined}
            className={`mt-2 w-full rounded-full border-2 px-4 py-3 text-text-primary bg-bg-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.password
                ? 'border-error bg-error/10 focus:border-error focus:ring-error/50'
                : 'border-[rgba(255,255,255,0.5)] focus:border-primary focus:ring-primary/50'
            }`}
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && (
            <p id="admin-password-error" className="mt-1 text-xs text-error">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-interactive-default px-4 py-3 font-semibold text-on-interactive transition-colors hover:bg-interactive-hover focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
        {mutation.isError && <p className="text-center text-xs text-error">Invalid credentials. Try again.</p>}
      </form>
    </div>
  );
}

export default AdminLogin;
