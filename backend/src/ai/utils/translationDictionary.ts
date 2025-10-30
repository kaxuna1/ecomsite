/**
 * Hair Care Terminology Dictionary
 *
 * Provides correct translations for technical hair care terms
 * to ensure accurate and consistent product translations
 */

export type SupportedLanguage = 'en' | 'ka' | 'ru' | 'tr' | 'ar' | 'fr' | 'de' | 'es';

export interface TerminologyDictionary {
  [key: string]: Record<string, string>;
}

/**
 * Hair care terminology for supported languages
 *
 * English terms mapped to their correct translations
 */
export const hairCareTerminology: Record<string, Record<string, string>> = {
  // Georgian (ქართული)
  'ka': {
    // Hair & Scalp Terms
    'scalp': 'თავის კანი',
    'hair': 'თმა',
    'hair follicle': 'თმის ფოლიკული',
    'hair shaft': 'თმის ღერო',
    'hair root': 'თმის ფესვი',
    'hair strand': 'თმის ძაფი',
    'hair loss': 'თმის ცვენა',
    'hair growth': 'თმის ზრდა',
    'hair texture': 'თმის ტექსტურა',
    'hair volume': 'თმის მოცულობა',
    'damaged hair': 'დაზიანებული თმა',
    'dry hair': 'მშრალი თმა',
    'oily hair': 'ცხიმიანი თმა',
    'frizzy hair': 'ხვეული თმა',
    'split ends': 'გაპობებული წვერები',
    'dandruff': 'პალანა',
    'itchy scalp': 'თავის კანის ქავილი',
    'scalp health': 'თავის კანის ჯანმრთელობა',

    // Product Types
    'serum': 'სერუმი',
    'shampoo': 'შამპუნი',
    'conditioner': 'კონდიციონერი',
    'hair mask': 'ნიღაბი თმისთვის',
    'oil': 'ზეთი',
    'treatment': 'მკურნალობა',
    'spray': 'სპრეი',
    'cream': 'კრემი',
    'gel': 'გელი',
    'foam': 'ქაფი',

    // Ingredients
    'biotin': 'ბიოტინი',
    'keratin': 'კერატინი',
    'collagen': 'კოლაგენი',
    'vitamin': 'ვიტამინი',
    'protein': 'ცილა',
    'amino acid': 'ამინომჟავა',
    'antioxidant': 'ანტიოქსიდანტი',
    'peptide': 'პეპტიდი',
    'hyaluronic acid': 'ჰიალურონის მჟავა',
    'argan oil': 'არგანის ზეთი',
    'coconut oil': 'ქოქოსის ზეთი',
    'jojoba oil': 'ჟოჟობას ზეთი',
    'tea tree oil': 'ჩაის ხის ზეთი',
    'lavender oil': 'ლავანდის ზეთი',
    'rosemary oil': 'როზმარინის ზეთი',
    'peppermint oil': 'პიტნის ზეთი',
    'aloe vera': 'ალოე ვერა',
    'chamomile': 'რ წვანი',
    'ginseng': 'ჟენშენი',
    'caffeine': 'კოფეინი',

    // Hair Conditions
    'moisturize': 'დატენიანება',
    'hydrate': 'ჰიდრატაცია',
    'nourish': 'კვება',
    'strengthen': 'გამაგრება',
    'repair': 'აღდგენა',
    'restore': 'რესტავრაცია',
    'protect': 'დაცვა',
    'detangle': 'გაშლა',
    'smooth': 'გამარტივება',
    'shine': 'ბზინვარება',
    'gloss': 'ბრწყინვალება',
    'softness': 'სიმ soft',
    'elasticity': 'ელასტიურობა',
    'thickness': 'სისქე',

    // Benefits
    'anti-aging': 'ანტი-ასაკოვანი',
    'anti-frizz': 'ანტი-ხვეულის',
    'anti-breakage': 'მოტეხვის საწინააღმდეგო',
    'color protection': 'ფერის დაცვა',
    'heat protection': 'სითბოს დაცვა',
    'UV protection': 'UV დაცვა',
    'volumizing': 'მოცულობის მომატება',
    'thickening': 'სისქის გაზრდა',
    'lengthening': 'გაგრძელება',
    'curl defining': 'ლოკების განსაზღვრა',
    'straightening': 'გასწორება',

    // Application
    'apply': 'დაასხით',
    'massage': 'მასაჟი',
    'rinse': 'ჩამოიბანეთ',
    'leave-in': 'დატოვეთ თმაზე',
    'wash out': 'ჩამოიბანეთ',
    'towel dry': 'გააშრეთ პირსახოცით',
    'air dry': 'გააშრეთ ჰაერზე',
    'blow dry': 'გააშრეთ ფენით',

    // General
    'organic': 'ორგანული',
    'natural': 'ბუნებრივი',
    'paraben-free': 'პარაბენების გარეშე',
    'sulfate-free': 'სულფატების გარეშე',
    'silicone-free': 'სილიკონის გარეშე',
    'cruelty-free': 'სისასტიკის გარეშე',
    'vegan': 'ვეგანური',
    'dermatologist tested': 'დერმატოლოგიურად ტესტირებული',
    'clinically proven': 'კლინიკურად დადასტურებული',
    'professional grade': 'პროფესიონალური ხარისხი',
    'salon quality': 'სალონის ხარისხი',
    'luxury formula': 'ფუფუნების ფორმულა',
    'premium ingredients': 'პრემიუმ ინგრედიენტები',
  },

  // Russian (Русский) - Future expansion
  'ru': {
    'scalp': 'кожа головы',
    'hair': 'волосы',
    'hair follicle': 'волосяной фолликул',
    'serum': 'сыворотка',
    'shampoo': 'шампунь',
    'conditioner': 'кондиционер',
    'biotin': 'биотин',
    'keratin': 'кератин',
    'collagen': 'коллаген',
    'dandruff': 'перхоть',
    'moisturize': 'увлажнить',
    'nourish': 'питать',
    'strengthen': 'укрепить',
    'repair': 'восстановить',
    'organic': 'органический',
    'natural': 'натуральный',
    'luxury': 'роскошь',
  },

  // Turkish (Türkçe) - Future expansion
  'tr': {
    'scalp': 'saç derisi',
    'hair': 'saç',
    'serum': 'serum',
    'shampoo': 'şampuan',
    'conditioner': 'saç kremi',
    'biotin': 'biyotin',
    'keratin': 'keratin',
    'dandruff': 'kepek',
    'moisturize': 'nemlendirmek',
    'nourish': 'beslemek',
    'luxury': 'lüks',
  },

  // Arabic (العربية) - Future expansion
  'ar': {
    'scalp': 'فروة الرأس',
    'hair': 'شعر',
    'serum': 'مصل',
    'shampoo': 'شامبو',
    'conditioner': 'بلسم',
    'biotin': 'البيوتين',
    'keratin': 'الكيراتين',
    'luxury': 'فاخر',
  },

  // French (Français) - Future expansion
  'fr': {
    'scalp': 'cuir chevelu',
    'hair': 'cheveux',
    'serum': 'sérum',
    'shampoo': 'shampooing',
    'conditioner': 'après-shampooing',
    'luxury': 'luxe',
  },

  // German (Deutsch) - Future expansion
  'de': {
    'scalp': 'Kopfhaut',
    'hair': 'Haar',
    'serum': 'Serum',
    'shampoo': 'Shampoo',
    'conditioner': 'Conditioner',
    'luxury': 'Luxus',
  },

  // Spanish (Español) - Future expansion
  'es': {
    'scalp': 'cuero cabelludo',
    'hair': 'cabello',
    'serum': 'suero',
    'shampoo': 'champú',
    'conditioner': 'acondicionador',
    'luxury': 'lujo',
  },
};

/**
 * Get terminology for a specific language
 */
export function getTerminology(language: string): Record<string, string> | undefined {
  return hairCareTerminology[language];
}

/**
 * Translate a single term
 */
export function translateTerm(term: string, targetLanguage: string): string | undefined {
  const terminology = getTerminology(targetLanguage);
  if (!terminology) return undefined;

  // Case-insensitive lookup
  const lowerTerm = term.toLowerCase();
  for (const [key, value] of Object.entries(terminology)) {
    if (key.toLowerCase() === lowerTerm) {
      return value;
    }
  }

  return undefined;
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in hairCareTerminology;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(hairCareTerminology);
}
