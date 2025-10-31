import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useChangeLanguage, useLanguage } from '../hooks/useLocalizedPath';
import { fetchLanguages } from '../api/languages';

function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const currentLanguage = useLanguage();
  const changeLanguage = useChangeLanguage();

  // Fetch enabled languages from API
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false), // Only fetch enabled languages
    staleTime: 30 * 1000, // Cache for 30 seconds (refresh more frequently to pick up new languages)
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window gains focus
  });

  const handleLanguageChange = (newLang: string) => {
    changeLanguage(newLang);
  };

  // Show loading state or fallback
  if (isLoading || languages.length === 0) {
    return null;
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <Listbox value={currentLanguage} onChange={handleLanguageChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
            className="flex items-center gap-1 rounded-full border border-midnight/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-midnight transition hover:border-jade hover:text-jade"
            aria-label={t('language')}
          >
            <span>{currentLang?.code.toUpperCase()}</span>
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Listbox.Button>
          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Listbox.Options className="absolute right-0 z-20 mt-2 w-40 rounded-2xl border border-midnight/10 bg-white p-2 text-sm shadow-lg">
              {languages.map((lang) => (
                <Listbox.Option
                  key={lang.code}
                  value={lang.code}
                  className={({ active }) =>
                    `cursor-pointer rounded-xl px-3 py-2 ${active ? 'bg-champagne text-midnight' : 'text-midnight/80'}`
                  }
                >
                  {lang.nativeName}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}

export default LanguageSwitcher;
