import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  fetchLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  toggleLanguageEnabled
} from '../../api/languages';
import type { Language, LanguagePayload, UpdateLanguagePayload } from '../../types/language';

interface LanguageFormData {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isEnabled: boolean;
  displayOrder: number;
}

const emptyForm: LanguageFormData = {
  code: '',
  name: '',
  nativeName: '',
  isDefault: false,
  isEnabled: true,
  displayOrder: 0
};

export default function AdminLanguages() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState<LanguageFormData>(emptyForm);

  // Fetch all languages including disabled
  const { data: languages, isLoading } = useQuery({
    queryKey: ['languages', 'all'],
    queryFn: () => fetchLanguages(true)
  });

  // Create language mutation
  const createMutation = useMutation({
    mutationFn: createLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create language');
    }
  });

  // Update language mutation
  const updateMutation = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: UpdateLanguagePayload }) =>
      updateLanguage(code, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update language');
    }
  });

  // Delete language mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete language');
    }
  });

  // Toggle enabled mutation
  const toggleMutation = useMutation({
    mutationFn: toggleLanguageEnabled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle language status');
    }
  });

  const openCreateModal = () => {
    setEditingLanguage(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      isDefault: language.isDefault,
      isEnabled: language.isEnabled,
      displayOrder: language.displayOrder
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLanguage(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLanguage) {
      // Update existing language
      const payload: UpdateLanguagePayload = {
        name: formData.name,
        nativeName: formData.nativeName,
        isDefault: formData.isDefault,
        isEnabled: formData.isEnabled,
        displayOrder: formData.displayOrder
      };
      updateMutation.mutate({ code: editingLanguage.code, payload });
    } else {
      // Create new language
      const payload: LanguagePayload = {
        code: formData.code,
        name: formData.name,
        nativeName: formData.nativeName,
        isDefault: formData.isDefault,
        isEnabled: formData.isEnabled,
        displayOrder: formData.displayOrder
      };
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (language: Language) => {
    if (language.isDefault) {
      toast.error('Cannot delete the default language');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${language.name}? This will remove all translations in this language.`
    );

    if (confirmed) {
      deleteMutation.mutate(language.code);
    }
  };

  const handleToggle = (language: Language) => {
    if (language.isDefault && language.isEnabled) {
      toast.error('Cannot disable the default language');
      return;
    }
    toggleMutation.mutate(language.code);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blush border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.3em]">Language Management</h1>
          <p className="mt-2 text-sm text-champagne/60">
            Manage available languages and their settings
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-medium uppercase tracking-wider text-midnight transition-all hover:bg-blush/90"
        >
          Add Language
        </button>
      </div>

      {/* Languages Table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Code
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Native Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Default
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Order
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-[0.2em] text-champagne/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {languages?.map((language) => (
              <tr key={language.code} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono font-semibold text-champagne">
                    {language.code.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-champagne">{language.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-champagne">{language.nativeName}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggle(language)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider transition-colors ${
                      language.isEnabled
                        ? 'bg-jade/20 text-jade'
                        : 'bg-champagne/20 text-champagne/60'
                    }`}
                  >
                    {language.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {language.isDefault && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-blush/20 text-blush">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-champagne">{language.displayOrder}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(language)}
                    className="text-blush hover:text-blush/80 mr-4 transition-colors"
                  >
                    Edit
                  </button>
                  {!language.isDefault && (
                    <button
                      onClick={() => handleDelete(language)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-midnight border border-white/10 rounded-3xl max-w-md w-full p-8">
            <h2 className="font-display text-2xl uppercase tracking-[0.3em] mb-6">
              {editingLanguage ? 'Edit Language' : 'Add New Language'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Language Code */}
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80 mb-2">
                  Language Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  disabled={!!editingLanguage}
                  placeholder="e.g., en, es, fr"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none disabled:opacity-50"
                  required
                  maxLength={5}
                />
                <p className="mt-2 text-xs text-champagne/60">2-5 characters (ISO 639-1 code)</p>
              </div>

              {/* Language Name */}
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80 mb-2">
                  Language Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., English, Spanish"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none"
                  required
                />
              </div>

              {/* Native Name */}
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80 mb-2">
                  Native Name *
                </label>
                <input
                  type="text"
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  placeholder="e.g., English, Español"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none"
                  required
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  min="0"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
                />
                <p className="mt-2 text-xs text-champagne/60">Lower numbers appear first</p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-blush focus:ring-blush focus:ring-offset-0 transition-colors"
                  />
                  <span className="ml-3 text-sm text-champagne/80 group-hover:text-champagne transition-colors">Enable this language</span>
                </label>

                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-blush focus:ring-blush focus:ring-offset-0 transition-colors"
                  />
                  <span className="ml-3 text-sm text-champagne/80 group-hover:text-champagne transition-colors">Set as default language</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium uppercase tracking-wider text-champagne/80 transition-all hover:bg-white/10 hover:text-champagne"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-full bg-blush px-6 py-3 text-sm font-medium uppercase tracking-wider text-midnight transition-all hover:bg-blush/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingLanguage
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
