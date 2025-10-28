import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchPublicFooterSettings } from '../api/cms';
import { useI18n } from '../context/I18nContext';

interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    url: string;
    is_external?: boolean;
  }>;
}

interface FooterSettings {
  brandName: string;
  brandTagline: string | null;
  footerColumns: FooterColumn[];
  contactInfo: {
    address?: {
      label: string;
      street: string;
      city: string;
      country: string;
    };
    email?: string;
    phone?: string;
  };
  socialLinks: Array<{
    platform: string;
    url: string;
    icon: string;
    is_enabled: boolean;
  }>;
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButtonText: string;
  copyrightText: string | null;
  bottomLinks: Array<{ label: string; url: string }>;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layoutType: string;
  columnsCount: number;
  showDividers: boolean;
}

function Footer() {
  const { t } = useI18n();
  const { i18n } = useTranslation();
  const year = new Date().getFullYear();

  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ['footer-settings-public', i18n.language],
    queryFn: () => fetchPublicFooterSettings(i18n.language),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fallback to hardcoded values if CMS data isn't available
  if (!footerSettings) {
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
                hello@luxiaproducts.com
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

  const renderSocialIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z',
      facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      twitter: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
      youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
      linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      pinterest: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z',
      tiktok: 'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'
    };

    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d={icons[platform] || icons.instagram} />
      </svg>
    );
  };

  return (
    <footer
      style={{
        backgroundColor: footerSettings.backgroundColor,
        color: footerSettings.textColor
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Top Section with Columns */}
        <div
          className={`grid gap-8 ${
            footerSettings.columnsCount === 1
              ? 'grid-cols-1'
              : footerSettings.columnsCount === 2
              ? 'md:grid-cols-2'
              : footerSettings.columnsCount === 3
              ? 'md:grid-cols-3'
              : footerSettings.columnsCount === 4
              ? 'md:grid-cols-4'
              : footerSettings.columnsCount === 5
              ? 'md:grid-cols-5'
              : 'md:grid-cols-6'
          }`}
        >
          {/* Brand Column */}
          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.3em]">
              {footerSettings.brandName}
            </h2>
            {footerSettings.brandTagline && (
              <p className="mt-4 max-w-xs text-sm opacity-80">{footerSettings.brandTagline}</p>
            )}
          </div>

          {/* Footer Columns */}
          {footerSettings.footerColumns.map((column, index) => (
            <div key={index}>
              <h3 className="text-sm font-semibold uppercase tracking-widest">{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      target={link.is_external ? '_blank' : '_self'}
                      rel={link.is_external ? 'noopener noreferrer' : undefined}
                      className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          {footerSettings.contactInfo && (
            <div>
              {footerSettings.contactInfo.address && (
                <>
                  <h3 className="text-sm font-semibold uppercase tracking-widest">
                    {footerSettings.contactInfo.address.label}
                  </h3>
                  <p className="mt-4 text-sm opacity-80">
                    {footerSettings.contactInfo.address.street}
                    <br />
                    {footerSettings.contactInfo.address.city}
                    <br />
                    {footerSettings.contactInfo.address.country}
                  </p>
                </>
              )}
              {(footerSettings.contactInfo.email || footerSettings.contactInfo.phone) && (
                <div className="mt-4 text-sm opacity-80 space-y-1">
                  {footerSettings.contactInfo.email && (
                    <div>{footerSettings.contactInfo.email}</div>
                  )}
                  {footerSettings.contactInfo.phone && (
                    <div>{footerSettings.contactInfo.phone}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Newsletter Section */}
        {footerSettings.newsletterEnabled && (
          <div className="mt-12 pt-8 border-t border-current/10">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-display text-lg uppercase tracking-wide">
                {footerSettings.newsletterTitle}
              </h3>
              <p className="mt-2 text-sm opacity-80">{footerSettings.newsletterDescription}</p>
              <form className="mt-4 flex gap-2">
                <input
                  type="email"
                  placeholder={footerSettings.newsletterPlaceholder}
                  className="flex-1 px-4 py-2 bg-white/10 border border-current/20 rounded-lg focus:outline-none focus:border-current/40"
                  style={{ color: footerSettings.textColor }}
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: footerSettings.accentColor,
                    color: footerSettings.backgroundColor
                  }}
                >
                  {footerSettings.newsletterButtonText}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Social Links */}
        {footerSettings.socialLinks.filter((s) => s.is_enabled).length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            {footerSettings.socialLinks
              .filter((social) => social.is_enabled)
              .map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: footerSettings.accentColor }}
                >
                  {renderSocialIcon(social.platform)}
                </a>
              ))}
          </div>
        )}

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-current/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">
              {footerSettings.copyrightText
                ? footerSettings.copyrightText.replace('{year}', year.toString())
                : `© ${year} ${footerSettings.brandName}`}
            </p>
            {footerSettings.bottomLinks.length > 0 && (
              <div className="flex gap-4">
                {footerSettings.bottomLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
