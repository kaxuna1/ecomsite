import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

interface LoginForm {
  username: string;
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
    mutationFn: login,
    onSuccess: (data) => setToken(data.token)
  });

  const onSubmit = (form: LoginForm) => {
    mutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight text-champagne">
      <Helmet>
        <title>Admin Login — Luxia</title>
      </Helmet>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-6 rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur"
      >
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase tracking-[0.4em]">Admin</h1>
          <p className="mt-2 text-sm text-champagne/70">Sign in to manage rituals and orders.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold uppercase tracking-[0.3em] text-champagne/70">
            Username
            <input
              type="text"
              className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3 text-champagne"
              {...register('username', { required: 'Username is required' })}
            />
          </label>
          {errors.username && <p className="mt-1 text-xs text-rose-200">{errors.username.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold uppercase tracking-[0.3em] text-champagne/70">
            Password
            <input
              type="password"
              className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3 text-champagne"
              {...register('password', { required: 'Password is required' })}
            />
          </label>
          {errors.password && <p className="mt-1 text-xs text-rose-200">{errors.password.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full bg-blush text-midnight hover:bg-champagne" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
        {mutation.isError && <p className="text-center text-xs text-rose-200">Invalid credentials. Try again.</p>}
      </form>
    </div>
  );
}

export default AdminLogin;
