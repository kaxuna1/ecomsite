import { useI18n } from '../context/I18nContext';

function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-midnight text-champagne">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.3em]">{t('common.brand')}</h2>
            <p className="mt-4 max-w-xs text-sm text-champagne/80">{t('hero.description')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">{t('footer.visit')}</h3>
            <p className="mt-4 text-sm text-champagne/80">
              Atelier Luxia
              <br />
              88 Crown Street
              <br />
              New York, NY 10013
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">{t('footer.stay')}</h3>
            <p className="mt-4 text-sm text-champagne/80">
              hello@luxiarituals.com
              <br />
              (212) 555-0199
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-champagne/60">
          {t('footer.crafted', { values: { year } })}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
