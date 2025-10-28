import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
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
  const { user, refreshUser } = useAuth();
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
    { name: 'Profile', href: '/account/profile', icon: UserIcon },
    { name: 'Orders', href: '/account/orders', icon: ShoppingBagIcon },
    { name: 'Favorites', href: '/account/favorites', icon: HeartIcon }
  ];

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // TODO: Implement update profile API
      // await updateProfile(data);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
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
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl text-midnight mb-2">My Account</h1>
          <p className="text-midnight/60">Manage your profile and preferences</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-champagne/40 mb-6"
        >
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-jade text-white shadow-lg'
                      : 'text-midnight/60 hover:bg-champagne/30 hover:text-midnight'
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
          className="bg-white rounded-3xl shadow-2xl border border-champagne/40 overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-jade to-jade/80 px-8 py-12 text-white">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-4 border-white/30">
                <span className="text-4xl font-display uppercase">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-display mb-2">{user.name}</h2>
                <div className="flex items-center gap-2 text-white/80">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">Member since {memberSince}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
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
                <label className="block text-sm font-semibold text-midnight mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-midnight/40" />
                  </div>
                  <input
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    type="text"
                    disabled={!isEditing}
                    className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-jade/50 focus:border-jade transition-colors ${
                      isEditing
                        ? errors.name
                          ? 'border-red-300 bg-red-50'
                          : 'border-champagne/60 bg-champagne/10'
                        : 'border-champagne/40 bg-champagne/5 text-midnight/60 cursor-not-allowed'
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
                <label className="block text-sm font-semibold text-midnight mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-midnight/40" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="block w-full pl-12 pr-4 py-3 border border-champagne/40 rounded-xl bg-champagne/5 text-midnight/60 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-midnight/40">Email cannot be changed</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                {!isEditing ? (
                  <motion.button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-6 py-3 bg-jade text-white rounded-xl font-semibold shadow-lg hover:bg-jade/90 transition-all"
                  >
                    <PencilIcon className="h-5 w-5" />
                    Edit Profile
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-6 py-3 bg-jade text-white rounded-xl font-semibold shadow-lg hover:bg-jade/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleCancel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-6 py-3 bg-midnight/10 text-midnight rounded-xl font-semibold hover:bg-midnight/20 transition-all"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      Cancel
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
