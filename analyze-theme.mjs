import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:5175';
const EMAIL = 'kaxgel11@gmail.com';
const PASSWORD = 'GVA@edw0fke6urq8wer';

async function analyzePages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const analysis = {
    pages: []
  };

  try {
    console.log('🚀 Starting page analysis...\n');

    // Navigate to home
    console.log('📍 Navigating to homepage...');
    await page.goto(`${BASE_URL}/en/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/en/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('✅ Login successful!\n');

    // Pages to analyze
    const pagesToAnalyze = [
      { name: 'Homepage', url: '/en/', selector: 'main' },
      { name: 'Products', url: '/en/products', selector: 'main' },
      { name: 'Product Detail', url: '/en/products', selector: 'main', clickFirst: 'a[href*="/en/product/"]' },
      { name: 'Cart', url: '/en/cart', selector: 'main' },
      { name: 'Profile', url: '/en/account/profile', selector: 'main' },
      { name: 'Orders', url: '/en/account/orders', selector: 'main' },
      { name: 'Favorites', url: '/en/account/favorites', selector: 'main' }
    ];

    for (const pageInfo of pagesToAnalyze) {
      console.log(`📄 Analyzing: ${pageInfo.name}...`);

      try {
        await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);

        // Click first element if needed
        if (pageInfo.clickFirst) {
          const firstElement = await page.locator(pageInfo.clickFirst).first();
          if (await firstElement.count() > 0) {
            await firstElement.click();
            await page.waitForTimeout(2000);
          }
        }

        // Analyze visibility issues
        const issues = await page.evaluate(() => {
          const problems = [];

          // Check buttons
          const buttons = document.querySelectorAll('button, .btn, [class*="btn-"]');
          buttons.forEach((btn, index) => {
            const style = window.getComputedStyle(btn);
            const bgColor = style.backgroundColor;
            const textColor = style.color;
            const rect = btn.getBoundingClientRect();

            // Check if button is visible and has low contrast
            if (rect.width > 0 && rect.height > 0) {
              // Get parent background
              let parent = btn.parentElement;
              let parentBg = 'transparent';
              while (parent && parentBg === 'transparent') {
                parentBg = window.getComputedStyle(parent).backgroundColor;
                parent = parent.parentElement;
              }

              // Simple contrast check (this is approximate)
              const btnClasses = btn.className;
              if (btnClasses.includes('bg-primary') || btnClasses.includes('bg-jade')) {
                problems.push({
                  type: 'button',
                  element: btn.tagName,
                  text: btn.textContent?.trim().substring(0, 50),
                  classes: btnClasses,
                  bgColor,
                  textColor,
                  parentBg,
                  position: { x: rect.x, y: rect.y }
                });
              }
            }
          });

          // Check inputs
          const inputs = document.querySelectorAll('input, textarea, select');
          inputs.forEach(input => {
            const style = window.getComputedStyle(input);
            const borderColor = style.borderColor;
            const bgColor = style.backgroundColor;

            if (borderColor.includes('rgba') && borderColor.includes('0.')) {
              problems.push({
                type: 'input',
                element: input.tagName,
                borderColor,
                bgColor,
                classes: input.className
              });
            }
          });

          // Check cards/containers
          const cards = document.querySelectorAll('[class*="card"], [class*="bg-"]');
          cards.forEach(card => {
            const style = window.getComputedStyle(card);
            const bgColor = style.backgroundColor;
            const borderColor = style.borderColor;

            if (borderColor.includes('rgba') && borderColor.includes('0.4')) {
              problems.push({
                type: 'border-opacity',
                element: card.tagName,
                borderColor,
                classes: card.className
              });
            }
          });

          return problems;
        });

        // Take screenshot
        const screenshotPath = `screenshots/${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        analysis.pages.push({
          name: pageInfo.name,
          url: pageInfo.url,
          issues: issues.length,
          problems: issues,
          screenshot: screenshotPath
        });

        console.log(`  ✓ Found ${issues.length} potential issues`);
        console.log(`  ✓ Screenshot saved: ${screenshotPath}\n`);

      } catch (error) {
        console.log(`  ⚠️  Error analyzing ${pageInfo.name}: ${error.message}\n`);
      }
    }

    // Save analysis report
    const report = JSON.stringify(analysis, null, 2);
    fs.writeFileSync('theme-analysis-report.json', report);

    console.log('📊 Analysis complete! Report saved to theme-analysis-report.json\n');
    console.log('Summary:');
    console.log(`  Total pages analyzed: ${analysis.pages.length}`);
    console.log(`  Total issues found: ${analysis.pages.reduce((sum, p) => sum + p.issues, 0)}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

analyzePages();
