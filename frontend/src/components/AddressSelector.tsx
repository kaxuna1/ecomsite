import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { UserAddress, CreateAddressPayload } from '../types/address';
import { fetchAddresses, createAddress, deleteAddress, setDefaultAddress } from '../api/addresses';

interface AddressSelectorProps {
  onSelect: (address: UserAddress | null) => void;
  selectedAddressId: number | null;
}

export default function AddressSelector({ onSelect, selectedAddressId }: AddressSelectorProps) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateAddressPayload>({
    name: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: 'USA',
    label: 'Home'
  });

  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(t('address.addedSuccess'));
      setShowAddForm(false);
      onSelect(newAddress);
      setFormData({
        name: '',
        addressLine1: '',
        city: '',
        postalCode: '',
        country: 'USA',
        label: 'Home'
      });
    },
    onError: () => {
      toast.error(t('address.addedError'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(t('address.deletedSuccess'));
    },
    onError: () => {
      toast.error(t('address.deletedError'));
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(t('address.defaultUpdated'));
    },
    onError: () => {
      toast.error(t('address.defaultUpdateError'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const formatAddress = (address: UserAddress) => {
    const parts = [address.addressLine1];
    if (address.addressLine2) parts.push(address.addressLine2);
    parts.push(`${address.city}, ${address.state || ''} ${address.postalCode}`);
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-jade"></div>
        <p className="text-midnight/70 mt-2 text-sm">{t('address.loadingAddresses')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-midnight flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          {t('address.savedAddresses')}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 text-sm font-medium text-jade hover:text-jade/80 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t('address.addNew')}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 rounded-2xl border-2 border-jade/20 bg-champagne/20 p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.label')}
                </label>
                <select
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                >
                  <option value="Home">{t('address.labelHome')}</option>
                  <option value="Work">{t('address.labelWork')}</option>
                  <option value="Other">{t('address.labelOther')}</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.streetAddress')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="123 Main St"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.aptSuite')}
                </label>
                <input
                  type="text"
                  value={formData.addressLine2 || ''}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="Apt 4B"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.city')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.state')}
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.postalCode')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight mb-1">
                  {t('address.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border-2 border-jade/30 bg-white px-3 py-2 text-midnight transition-colors focus:border-jade focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border-2 border-champagne/30 bg-white px-4 py-2 text-sm font-medium text-midnight transition-colors hover:bg-champagne/20"
              >
                {t('address.cancel')}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  createMutation.mutate(formData);
                }}
                disabled={createMutation.isPending}
                className="flex-1 rounded-lg bg-jade px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-jade/90 disabled:opacity-50"
              >
                {createMutation.isPending ? t('address.saving') : t('address.saveAddress')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border-2 border-champagne/20 bg-champagne/10">
            <MapPinIcon className="mx-auto h-12 w-12 text-midnight/30" />
            <p className="text-midnight/70 mt-2">{t('address.noSavedYet')}</p>
            <p className="text-sm text-midnight/50">{t('address.addOneToSaveTime')}</p>
          </div>
        ) : (
          addresses.map((address) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                selectedAddressId === address.id
                  ? 'border-jade bg-jade/10 shadow-lg'
                  : 'border-champagne/30 bg-white hover:border-jade/50'
              }`}
              onClick={() => onSelect(address)}
            >
              {selectedAddressId === address.id && (
                <CheckCircleIcon className="absolute top-4 right-4 h-6 w-6 text-jade" />
              )}
              <div className="flex items-start gap-3 pr-8">
                <div className="mt-1">
                  <HomeIcon className="h-5 w-5 text-jade" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {address.label && (
                      <span className="inline-block rounded-full bg-jade/20 px-2 py-0.5 text-xs font-semibold text-jade">
                        {address.label}
                      </span>
                    )}
                    {address.isDefault && (
                      <span className="inline-block rounded-full bg-blush/20 px-2 py-0.5 text-xs font-semibold text-blush">
                        {t('address.default')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-midnight">{address.name}</p>
                  <p className="mt-1 text-sm text-midnight/70">{formatAddress(address)}</p>
                  {address.phone && <p className="mt-1 text-sm text-midnight/70">{address.phone}</p>}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {!address.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultMutation.mutate(address.id);
                    }}
                    className="text-xs text-jade hover:text-jade/80 transition-colors"
                  >
                    {t('address.setAsDefault')}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('address.deleteConfirm', { name: address.name }))) {
                      deleteMutation.mutate(address.id);
                    }
                  }}
                  className="text-xs text-blush hover:text-blush/80 transition-colors"
                >
                  {t('address.delete')}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
}
