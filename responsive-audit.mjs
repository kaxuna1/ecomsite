import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@luxia.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LuxiaAdmin2024!';
const USER_EMAIL = process.env.USER_EMAIL || 'k@k.ge';
const USER_PASSWORD = process.env.USER_PASSWORD || 'LuxiaUser2024!';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'ipad', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 }
];

const customerPages = [
  { name: 'Home', url: '/en/' },
  { name: 'Products', url: '/en/products' },
  { name: 'Search', url: '/en/search' },
  { name: 'New Arrivals', url: '/en/new-arrivals' },
  { name: 'Best Sellers', url: '/en/best-sellers' },
  { name: 'Sale', url: '/en/sale' },
  { name: 'Product Detail', url: null },
  { name: 'Cart', url: '/en/cart' },
  { name: 'Checkout', url: '/en/checkout' },
  { name: 'Order Success', url: '/en/order-success' },
  { name: 'Account Profile', url: '/en/account/profile' },
  { name: 'Account Orders', url: '/en/account/orders' },
  { name: 'Account Favorites', url: '/en/account/favorites' },
  { name: 'Account Reviews', url: '/en/account/reviews' }
];

const adminPages = [
  { name: 'Admin Dashboard', url: '/admin' },
  { name: 'Admin Products', url: '/admin/products' },
  { name: 'Admin Product New', url: '/admin/products/new' },
  { name: 'Admin Product Edit', url: null },
  { name: 'Admin Attributes', url: '/admin/attributes' },
  { name: 'Admin Variant Options', url: '/admin/variant-options' },
  { name: 'Admin Media', url: '/admin/media' },
  { name: 'Admin Orders', url: '/admin/orders' },
  { name: 'Admin Reviews', url: '/admin/reviews' },
  { name: 'Admin Promo Codes', url: '/admin/promo-codes' },
  { name: 'Admin CMS', url: '/admin/cms' },
  { name: 'Admin CMS Edit', url: null },
  { name: 'Admin CMS Inline Edit', url: null },
  { name: 'Admin Users', url: '/admin/admin-users' },
  { name: 'Admin Customers', url: '/admin/customers' },
  { name: 'Admin Navigation', url: '/admin/navigation' },
  { name: 'Admin Settings', url: '/admin/settings' },
  { name: 'Admin Languages', url: '/admin/languages' },
  { name: 'Admin Translations', url: '/admin/translations' },
  { name: 'Admin CMS Translations', url: '/admin/cms-translations' },
  { name: 'Admin Static Translations', url: '/admin/static-translations' },
  { name: 'Admin Newsletter', url: '/admin/newsletter' },
  { name: 'Admin Themes', url: '/admin/themes' }
];

const outputRoot = path.join(process.cwd(), 'responsive-audit');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const slugify = (input) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const getAdminToken = async () => {
  const result = await fetchJson(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  return result?.token;
};

const getFirstProductId = async () => {
  const result = await fetchJson(`${API_URL}/products?lang=en&limit=1`);
  const product = result?.products?.[0];
  return product?.id ?? null;
};

const getFirstCmsPageId = async (adminToken) => {
  if (!adminToken) return null;
  const result = await fetchJson(`${API_URL}/cms/pages?limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const page = Array.isArray(result) ? result[0] : result?.pages?.[0] ?? result?.[0];
  return page?.id ?? null;
};

const loginCustomer = async (page) => {
  await page.goto(`${BASE_URL}/en/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[type="email"]', USER_EMAIL);
  await page.fill('input[type="password"]', USER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
};

const loginAdmin = async (page) => {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
};

const analyzeLayout = async (page) => {
  return await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isHidden = (style) =>
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0';

    const toRect = (rect) => ({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });

    const overflowElements = [];
    const clippedText = [];

    const elements = Array.from(document.querySelectorAll('body *'));

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (isHidden(style)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const offscreen = rect.right < 0 || rect.left > viewportWidth || rect.bottom < 0 || rect.top > viewportHeight;
      if (offscreen && (style.position === 'fixed' || style.position === 'absolute')) {
        continue;
      }

      if (rect.right > viewportWidth + 1 || rect.left < -1) {
        overflowElements.push({
          tag: el.tagName,
          id: el.id || null,
          className: el.className || null,
          text: (el.textContent || '').trim().slice(0, 80),
          rect: toRect(rect)
        });
      }

      if (el.scrollWidth > el.clientWidth + 6 && style.overflowX !== 'visible') {
        const text = (el.textContent || '').trim();
        if (text.length > 20) {
          clippedText.push({
            tag: el.tagName,
            id: el.id || null,
            className: el.className || null,
            text: text.slice(0, 80),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth
          });
        }
      }
    }

    const bodyOverflow =
      document.documentElement.scrollWidth > viewportWidth + 1 ||
      document.body.scrollWidth > viewportWidth + 1;

    return {
      viewport: { width: viewportWidth, height: viewportHeight },
      bodyOverflow,
      overflowElements: overflowElements.slice(0, 30),
      clippedText: clippedText.slice(0, 30)
    };
  });
};

const auditPages = async (page, pages, viewportName) => {
  const results = [];
  for (const entry of pages) {
    if (!entry.url) {
      results.push({
        name: entry.name,
        url: null,
        error: 'missing-url'
      });
      continue;
    }

    const url = `${BASE_URL}${entry.url}`;
    const screenshotPath = path.join(outputRoot, viewportName, `${slugify(entry.name)}.png`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1200);

      const analysis = await analyzeLayout(page);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        name: entry.name,
        url: entry.url,
        screenshot: path.relative(process.cwd(), screenshotPath),
        ...analysis
      });
    } catch (error) {
      results.push({
        name: entry.name,
        url: entry.url,
        screenshot: null,
        error: error.message
      });
    }
  }

  return results;
};

async function runAudit() {
  ensureDir(outputRoot);

  const adminToken = await getAdminToken().catch(() => null);
  const productId = await getFirstProductId().catch(() => null);
  const cmsPageId = await getFirstCmsPageId(adminToken).catch(() => null);

  if (productId) {
    customerPages.find((page) => page.name === 'Product Detail').url = `/en/products/${productId}`;
    adminPages.find((page) => page.name === 'Admin Product Edit').url = `/admin/products/${productId}/edit`;
  }

  if (cmsPageId) {
    adminPages.find((page) => page.name === 'Admin CMS Edit').url = `/admin/cms/edit/${cmsPageId}`;
    adminPages.find((page) => page.name === 'Admin CMS Inline Edit').url = `/admin/cms/inline-edit/${cmsPageId}`;
  }

  const browser = await chromium.launch({ headless: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    viewports: []
  };

  try {
    for (const viewport of viewports) {
      const viewportDir = path.join(outputRoot, viewport.name);
      ensureDir(viewportDir);

      const customerContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const customerPage = await customerContext.newPage();
      await loginCustomer(customerPage);

      const customerResults = await auditPages(customerPage, customerPages, viewport.name);
      await customerContext.close();

      const adminContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const adminPage = await adminContext.newPage();
      await loginAdmin(adminPage);

      const adminResults = await auditPages(adminPage, adminPages, viewport.name);
      await adminContext.close();

      report.viewports.push({
        name: viewport.name,
        width: viewport.width,
        height: viewport.height,
        customer: customerResults,
        admin: adminResults
      });
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(outputRoot, 'responsive-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Audit complete: ${path.relative(process.cwd(), reportPath)}`);
}

runAudit().catch((error) => {
  console.error('Audit failed:', error);
  process.exit(1);
});
