import { useI18n } from '../context/I18nContext';

function LoadingScreen() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-champagne">
      <span className="sr-only">{t('common.loading')}</span>
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-midnight/10 border-t-jade"></div>
    </div>
  );
}

export default LoadingScreen;
