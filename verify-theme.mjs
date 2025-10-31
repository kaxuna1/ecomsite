import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5175';
const EMAIL = 'kaxgel11@gmail.com';
const PASSWORD = 'GVA@edw0fke6urq8wer';

async function verifyTheme() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting theme verification...\n');

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

    // Navigate to profile page
    console.log('📄 Navigating to Profile page...');
    await page.goto(`${BASE_URL}/en/account/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check theme CSS injection
    console.log('\n🔍 Checking dynamic theme CSS injection...\n');
    const themeCheck = await page.evaluate(() => {
      // Check for dynamic theme style tag
      const themeStyleTag = document.getElementById('luxia-theme-variables');

      if (!themeStyleTag) {
        return {
          error: 'Dynamic theme style tag not found!',
          hasThemeTag: false
        };
      }

      // Get the CSS content
      const cssContent = themeStyleTag.textContent || '';

      // Check if CSS variables are defined
      const hasColorVars = cssContent.includes('--color-brand-primary');
      const hasTypographyVars = cssContent.includes('--typography-fontFamily');

      // Get computed styles for a button
      const editButton = document.querySelector('button');
      let buttonStyles = null;

      if (editButton) {
        const computed = window.getComputedStyle(editButton);
        buttonStyles = {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderColor: computed.borderColor
        };
      }

      // Get CSS variable values from :root
      const rootStyles = window.getComputedStyle(document.documentElement);
      const cssVars = {
        brandPrimary: rootStyles.getPropertyValue('--color-brand-primary').trim(),
        brandSecondary: rootStyles.getPropertyValue('--color-brand-secondary').trim(),
        brandAccent: rootStyles.getPropertyValue('--color-brand-accent').trim(),
        interactiveDefault: rootStyles.getPropertyValue('--color-interactive-default').trim(),
        interactiveHover: rootStyles.getPropertyValue('--color-interactive-hover').trim(),
        interactiveActive: rootStyles.getPropertyValue('--color-interactive-active').trim(),
        bgPrimary: rootStyles.getPropertyValue('--color-background-primary').trim(),
        textPrimary: rootStyles.getPropertyValue('--color-text-primary').trim()
      };

      return {
        hasThemeTag: true,
        themeSource: themeStyleTag.getAttribute('data-theme-source'),
        cssLength: cssContent.length,
        hasColorVars,
        hasTypographyVars,
        cssVars,
        buttonStyles,
        firstCSSLines: cssContent.split('\n').slice(0, 10).join('\n')
      };
    });

    console.log('Theme Check Results:');
    console.log('='.repeat(60));

    if (themeCheck.error) {
      console.log(`❌ ${themeCheck.error}`);
    } else {
      console.log(`✅ Dynamic theme tag found: ${themeCheck.hasThemeTag}`);
      console.log(`   Source: ${themeCheck.themeSource}`);
      console.log(`   CSS Length: ${themeCheck.cssLength} characters`);
      console.log(`   Has Color Variables: ${themeCheck.hasColorVars}`);
      console.log(`   Has Typography Variables: ${themeCheck.hasTypographyVars}`);

      console.log('\n📊 CSS Variables from :root:');
      console.log('   Brand Primary:', themeCheck.cssVars.brandPrimary || '❌ NOT SET');
      console.log('   Brand Secondary:', themeCheck.cssVars.brandSecondary || '❌ NOT SET');
      console.log('   Brand Accent:', themeCheck.cssVars.brandAccent || '❌ NOT SET');
      console.log('   Interactive Default:', themeCheck.cssVars.interactiveDefault || '❌ NOT SET');
      console.log('   Interactive Hover:', themeCheck.cssVars.interactiveHover || '❌ NOT SET');
      console.log('   Interactive Active:', themeCheck.cssVars.interactiveActive || '❌ NOT SET');
      console.log('   Background Primary:', themeCheck.cssVars.bgPrimary || '❌ NOT SET');
      console.log('   Text Primary:', themeCheck.cssVars.textPrimary || '❌ NOT SET');

      if (themeCheck.buttonStyles) {
        console.log('\n🎨 Button Computed Styles:');
        console.log('   Background:', themeCheck.buttonStyles.backgroundColor);
        console.log('   Text Color:', themeCheck.buttonStyles.color);
        console.log('   Border:', themeCheck.buttonStyles.borderColor);
      }

      console.log('\n📄 First 10 lines of dynamic CSS:');
      console.log(themeCheck.firstCSSLines);
    }

    console.log('='.repeat(60));

    // Check if fallback CSS exists (should not exist after our changes)
    console.log('\n🔍 Checking for fallback CSS in theme.css...\n');
    const fallbackCheck = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);

      for (const sheet of stylesheets) {
        try {
          if (sheet.href && sheet.href.includes('theme.css')) {
            // Found theme.css stylesheet
            const rules = Array.from(sheet.cssRules || []);

            // Look for :root rule with fallbacks
            for (const rule of rules) {
              if (rule.selectorText === ':root' && rule.style.length > 0) {
                // Found :root with styles
                return {
                  found: true,
                  ruleCount: rule.style.length,
                  firstFewProps: Array.from({ length: Math.min(5, rule.style.length) }, (_, i) =>
                    `${rule.style[i]}: ${rule.style.getPropertyValue(rule.style[i])}`
                  )
                };
              }
            }

            return { found: false, message: 'theme.css found but no :root fallbacks' };
          }
        } catch (e) {
          // CORS or other error accessing stylesheet
        }
      }

      return { found: false, message: 'theme.css not found' };
    });

    if (fallbackCheck.found) {
      console.log('⚠️  WARNING: Fallback CSS still exists in theme.css!');
      console.log(`   :root rule has ${fallbackCheck.ruleCount} properties`);
      console.log('   First few properties:');
      fallbackCheck.firstFewProps.forEach(prop => console.log(`     ${prop}`));
    } else {
      console.log(`✅ No fallback CSS in theme.css: ${fallbackCheck.message}`);
    }

    // Take screenshot of profile page
    await page.screenshot({ path: 'theme-verification.png', fullPage: false });
    console.log('\n📸 Screenshot saved: theme-verification.png');

    console.log('\n✨ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

verifyTheme();
