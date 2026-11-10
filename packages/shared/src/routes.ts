// The one route map of the product's navigation: the nine sidebar
// destinations, the profile anchor, the four static routes, the three bare
// routes, the guest and shell targets, and the five bar slots. No page restates
// a path (contracts/ui-contracts.md §1, §8.3).

export const bareRoutes = {
  signUp: '/auth/sign-up',
  signIn: '/auth/sign-in',
  forgotPassword: '/auth/forgot-password',
} as const;

export const staticRoutes = {
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  faq: '/faq',
} as const;

export const shellRoutes = {
  home: '/',
  parts: '/parts',
  catalogs: '/catalogs',
  upload: '/upload',
  myFiles: '/my-files',
  cart: '/cart',
  notifications: '/notifications',
  messages: '/messages',
  profile: '/profile',
  profileSettings: '/profile#settings',
} as const;

/** The nine sidebar destinations, in the order the frame renders them. */
export const sidebarDestinations = [
  { key: 'home', label: 'الرئيسية', path: '/' },
  { key: 'parts', label: 'بحث وفر', path: '/parts' },
  { key: 'catalogs', label: 'الكتالوج', path: '/catalogs' },
  { key: 'upload', label: 'رفع كتالوج', path: '/upload' },
  { key: 'my-files', label: 'ملفاتي', path: '/my-files' },
  { key: 'cart', label: 'سلة المشتريات', path: '/cart' },
  { key: 'notifications', label: 'الإشعارات', path: '/notifications' },
  { key: 'messages', label: 'المراسلة', path: '/messages' },
  { key: 'profile', label: 'الملف الشخصي', path: '/profile' },
] as const;

/** The four static-page links, in the footer band's order. */
export const footerLinks = [
  { key: 'contact', label: 'اتصل بنا', path: '/contact' },
  { key: 'privacy', label: 'سياسة الخصوصية', path: '/privacy' },
  { key: 'terms', label: 'شروط الاستخدام', path: '/terms' },
  { key: 'faq', label: 'الأسئلة الشائعة', path: '/faq' },
] as const;

/**
 * The five bottom-bar slots. The centre slot is the bar's one action, so its
 * label names the act (contracts/ui-contracts.md §8.3).
 */
export const bottomBarSlots = [
  { key: 'home', label: 'الرئيسية', path: '/', raised: false },
  { key: 'upload', label: 'رفع كتالوج', path: '/upload', raised: false },
  { key: 'search', label: 'البحث في القطع', path: '/parts', raised: true },
  { key: 'my-files', label: 'ملفاتي', path: '/my-files', raised: false },
  { key: 'more', label: 'المزيد', path: null, raised: false },
] as const;

/** The two account-menu destinations. */
export const accountMenu = {
  profile: '/profile',
  settings: '/profile#settings',
} as const;

/** The destinations a guest is sent to the sign-in page from (FR-048). Home,
 * Parts, and Catalog are public: only the six merchant-area destinations
 * redirect, so a guest's Catalog link stays `/catalogs`. */
export const merchantAreaPaths: readonly string[] = [
  '/upload',
  '/my-files',
  '/cart',
  '/notifications',
  '/messages',
  '/profile',
];

export function destinationFor(path: string, guest: boolean): string {
  return guest && merchantAreaPaths.includes(path) ? bareRoutes.signIn : path;
}

export type BareRoute = (typeof bareRoutes)[keyof typeof bareRoutes];
