import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../context/I18nContext';

function LanguageSwitcher() {
  const { availableLanguages, language, setLanguage, t } = useI18n();

  return (
    <Listbox value={language} onChange={setLanguage}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
            className="flex items-center gap-1 rounded-full border border-midnight/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-midnight transition hover:border-jade hover:text-jade"
            aria-label={t('common.language')}
          >
            <span>{availableLanguages.find(({ code }) => code === language)?.label}</span>
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
              {availableLanguages.map(({ code, label }) => (
                <Listbox.Option
                  key={code}
                  value={code}
                  className={({ active }) =>
                    `cursor-pointer rounded-xl px-3 py-2 ${active ? 'bg-champagne text-midnight' : 'text-midnight/80'}`
                  }
                >
                  {label}
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
