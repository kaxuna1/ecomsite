import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShoppingBagIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface ProfileFormData {
  name: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || ''
    }
  });

  const tabs = [
    { name: t('account.profile'), href: `/${lang}/account/profile`, icon: UserIcon },
    { name: t('account.orders'), href: `/${lang}/account/orders`, icon: ShoppingBagIcon },
    { name: t('account.favorites'), href: `/${lang}/account/favorites`, icon: HeartIcon }
  ];

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // TODO: Implement update profile API
      // await updateProfile(data);
      await refreshUser();
      setMessage({ type: 'success', text: t('profile.updateSuccess') });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({ name: user?.name || '' });
    setIsEditing(false);
    setMessage(null);
  };

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="py-6 sm:py-8 lg:py-12 bg-surface-base min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl text-text-primary mb-2 sm:text-3xl lg:text-4xl">{t('profile.title')}</h1>
          <p className="text-text-secondary">{t('profile.subtitle')}</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-elevated rounded-xl shadow-xl border-2 border-border-default mb-4 sm:rounded-2xl sm:mb-6"
        >
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              // Normalize paths for comparison (remove trailing slashes)
              const normalizedPathname = location.pathname.replace(/\/$/, '');
              const normalizedHref = tab.href.replace(/\/$/, '');
              const isActive = normalizedPathname === normalizedHref;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all sm:gap-2 sm:px-4 sm:py-3 sm:rounded-xl sm:text-sm ${
                    isActive
                      ? 'bg-interactive-active text-on-interactive shadow-lg border-2 border-interactive-active'
                      : 'text-text-secondary hover:bg-bg-secondary/30 hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-elevated rounded-2xl shadow-xl border-2 border-border-default overflow-hidden sm:rounded-3xl"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-interactive-active via-primary to-primary px-4 py-8 text-on-primary sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-4 border-white/30 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                <span className="text-2xl font-display uppercase sm:text-3xl lg:text-4xl">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-display mb-2 text-center sm:text-left sm:text-2xl lg:text-3xl">{user.name}</h2>
                <div className="flex items-center gap-2 text-on-primary/80">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">{t('profile.memberSince')} {memberSince}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 px-4 py-3 rounded-xl text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
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
                    disabled={!isEditing}
                    className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                      isEditing
                        ? errors.name
                          ? 'border-red-300 bg-red-50'
                          : 'border-bg-secondary/60 bg-bg-secondary/10'
                        : 'border-border-default bg-bg-secondary/5 text-text-primary/60 cursor-not-allowed'
                    }`}
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

              {/* Email Field (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  {t('profile.emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-text-primary/40" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="block w-full pl-12 pr-4 py-3 border border-border-default rounded-xl bg-bg-secondary/5 text-text-primary/60 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-text-primary/40">{t('profile.emailCannotChange')}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:gap-4">
                {!isEditing ? (
                  <motion.button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-interactive-active text-on-interactive rounded-lg font-semibold shadow-lg hover:bg-interactive-hover transition-all sm:px-5 sm:py-3 sm:rounded-xl lg:px-6"
                  >
                    <PencilIcon className="h-5 w-5" />
                    {t('profile.editProfile')}
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-6 py-3 bg-interactive-active text-on-interactive rounded-xl font-semibold shadow-lg hover:bg-interactive-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <span>{t('profile.saving')}</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          <span>{t('profile.saveChanges')}</span>
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleCancel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-border-default bg-white text-text-primary rounded-lg font-semibold hover:bg-bg-secondary/30 transition-all sm:px-5 sm:py-3 sm:rounded-xl lg:px-6"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      {t('profile.cancel')}
                    </motion.button>
                  </>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
