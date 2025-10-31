import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { UserPlusIcon, EnvelopeIcon, LockClosedIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import type { RegisterPayload } from '../types/product';

interface SignupFormData extends RegisterPayload {
  confirmPassword: string;
}

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { userRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Support both state-based and query parameter redirects
  const redirectFromQuery = searchParams.get('redirect');
  const redirectFromState = (location.state as any)?.from;
  const from = redirectFromQuery || redirectFromState || '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SignupFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await userRegister({
        name: data.name,
        email: data.email,
        password: data.password
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || t('signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-secondary/30 via-white to-blush/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4"
          >
            <UserPlusIcon className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="font-display text-4xl text-text-primary mb-2">{t('signup.title')}</h2>
          <p className="text-text-primary/60">{t('signup.subtitle')}</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-bg-secondary/40"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-text-primary mb-2">
                {t('signup.fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-text-primary/40" />
                </div>
                <input
                  {...register('name', {
                    required: t('signup.nameRequired'),
                    minLength: { value: 2, message: t('signup.nameMinLength') }
                  })}
                  type="text"
                  id="name"
                  className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-bg-secondary/60 bg-bg-secondary/10'
                  }`}
                  placeholder={t('signup.namePlaceholder')}
                />
              </div>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                {t('login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-text-primary/40" />
                </div>
                <input
                  {...register('email', {
                    required: t('login.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('login.emailInvalid')
                    }
                  })}
                  type="email"
                  id="email"
                  className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-bg-secondary/60 bg-bg-secondary/10'
                  }`}
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-text-primary/40" />
                </div>
                <input
                  {...register('password', {
                    required: t('login.passwordRequired'),
                    minLength: { value: 6, message: t('login.passwordMinLength') }
                  })}
                  type="password"
                  id="password"
                  className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-bg-secondary/60 bg-bg-secondary/10'
                  }`}
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-primary mb-2">
                {t('signup.confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CheckCircleIcon className="h-5 w-5 text-text-primary/40" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: t('signup.confirmPasswordRequired'),
                    validate: (value) => value === password || t('signup.passwordsNoMatch')
                  })}
                  type="password"
                  id="confirmPassword"
                  className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-bg-secondary/60 bg-bg-secondary/10'
                  }`}
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                />
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>{t('signup.creatingAccount')}</span>
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5" />
                  <span>{t('signup.createAccount')}</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-primary/60">
              {t('signup.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {t('signup.signIn')}
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Link
            to="/"
            className="text-sm text-text-primary/60 hover:text-text-primary transition-colors"
          >
            {t('signup.backToHome')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
