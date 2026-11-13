import fs from 'fs';
import path from 'path';

console.log('--- STARTING ZEN SEO & MOBILE AUDIT ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`✗ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. Audit robots.txt
console.log('\n--- 1. AUDITING ROBOTS.TXT ---');
const robotsPath = path.resolve('Zen/frontend/public/robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists in public directory');
const robotsContent = fs.readFileSync(robotsPath, 'utf8');
assert(robotsContent.includes('Allow: /'), 'robots.txt allows root public pages');
assert(robotsContent.includes('Disallow: /checkout'), 'robots.txt disallows checkout');
assert(robotsContent.includes('Disallow: /account'), 'robots.txt disallows private buyer account');
assert(robotsContent.includes('Disallow: /seller/'), 'robots.txt disallows seller admin pages');
assert(robotsContent.includes('Disallow: /admin'), 'robots.txt disallows platform admin compliance');
assert(robotsContent.includes('Sitemap: https://zen.global/sitemap.xml'), 'robots.txt points to sitemap.xml');

// 2. Audit sitemap.xml
console.log('\n--- 2. AUDITING SITEMAP.XML ---');
const sitemapPath = path.resolve('Zen/frontend/public/sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in public directory');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml has valid XML declaration');
assert(sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap.xml uses standard sitemap schema');
assert(sitemapContent.includes('https://zen.global/'), 'sitemap.xml contains homepage');
assert(sitemapContent.includes('https://zen.global/results'), 'sitemap.xml contains discovery catalog');
assert(sitemapContent.includes('https://zen.global/assistant'), 'sitemap.xml contains AI assistant');
assert(sitemapContent.includes('https://zen.global/sell'), 'sitemap.xml contains merchant onboarding');
assert(sitemapContent.includes('https://zen.global/product/prod-sony-xm5-amazon-us'), 'sitemap.xml contains genuine product URLs');
assert(!sitemapContent.includes('/checkout'), 'sitemap.xml does NOT leak private checkout pages');
assert(!sitemapContent.includes('/seller/dashboard'), 'sitemap.xml does NOT leak private merchant dashboard');

// 3. Audit index.html Metadata
console.log('\n--- 3. AUDITING INDEX.HTML METADATA ---');
const indexPath = path.resolve('Zen/frontend/index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
assert(indexHtml.includes('name="viewport" content="width=device-width, initial-scale=1.0'), 'Viewport configured for mobile responsiveness');
assert(indexHtml.includes('name="theme-color" content="#172554"'), 'Theme color defined for mobile browsers');
assert(indexHtml.includes('name="description"'), 'Meta description defined in index.html');
assert(indexHtml.includes('property="og:title"'), 'Open Graph title tag defined');
assert(indexHtml.includes('property="og:image"'), 'Open Graph image tag defined');
assert(indexHtml.includes('name="twitter:card"'), 'Twitter card tag defined');
assert(indexHtml.includes('rel="canonical"'), 'Canonical link present in index.html');

// 4. Audit Social Preview Card Asset
console.log('\n--- 4. AUDITING BRANDED SOCIAL ASSETS ---');
const ogSvgPath = path.resolve('Zen/frontend/public/assets/branding/zen-og-card.svg');
const ogPngPath = path.resolve('Zen/frontend/public/assets/branding/zen-og-card.png');
assert(fs.existsSync(ogSvgPath), 'Branded SVG social sharing card exists');
assert(fs.existsSync(ogPngPath), 'Branded PNG social sharing card exists');

// 5. Audit SEOHead Implementation Across Public & Private Pages
console.log('\n--- 5. AUDITING SEOHEAD USAGE ---');
const seoHeadPath = path.resolve('Zen/frontend/src/components/common/SEOHead.jsx');
assert(fs.existsSync(seoHeadPath), 'SEOHead.jsx component exists');
const homeSrc = fs.readFileSync('Zen/frontend/src/pages/Home.jsx', 'utf8');
assert(homeSrc.includes('<SEOHead'), 'Home.jsx integrates SEOHead');
assert(homeSrc.includes('HOME_JSON_LD'), 'Home.jsx provides JSON-LD structured data');
assert(homeSrc.includes('Zen – AI-Powered Borderless Shopping with PayPal'), 'Home.jsx incorporates exact requested title & H1');

const productSrc = fs.readFileSync('Zen/frontend/src/pages/Product.jsx', 'utf8');
assert(productSrc.includes('<SEOHead'), 'Product.jsx integrates SEOHead');
assert(productSrc.includes("ogType=\"product\""), 'Product.jsx specifies ogType="product"');
assert(productSrc.includes('productJsonLd'), 'Product.jsx generates genuine Product & BreadcrumbList structured data');

const resultsSrc = fs.readFileSync('Zen/frontend/src/pages/Results.jsx', 'utf8');
assert(resultsSrc.includes('<SEOHead'), 'Results.jsx integrates SEOHead');

const sellerLayoutSrc = fs.readFileSync('Zen/frontend/src/layouts/SellerLayout.jsx', 'utf8');
assert(sellerLayoutSrc.includes('robots="noindex, nofollow"'), 'SellerLayout enforces noindex, nofollow on merchant portal');

const checkoutSrc = fs.readFileSync('Zen/frontend/src/pages/Checkout.jsx', 'utf8');
assert(checkoutSrc.includes('robots="noindex, nofollow"'), 'Checkout enforces noindex, nofollow on checkout flow');

const loginSrc = fs.readFileSync('Zen/frontend/src/pages/Login.jsx', 'utf8');
assert(loginSrc.includes('robots="noindex, nofollow"'), 'Login enforces noindex, nofollow');

// 6. Audit Accessibility & Semantic HTML
console.log('\n--- 6. AUDITING ACCESSIBILITY & SEMANTICS ---');
const appSrc = fs.readFileSync('Zen/frontend/src/App.jsx', 'utf8');
assert(appSrc.includes('Skip to main content'), 'AppShell includes accessible Skip to Main Content link');
assert(appSrc.includes('id="main-content"'), 'AppShell defines #main-content landmark');
assert(appSrc.includes('Suspense fallback='), 'App.jsx implements code splitting Suspense fallback');

const filtersSrc = fs.readFileSync('Zen/frontend/src/components/products/ProductFilters.jsx', 'utf8');
assert(filtersSrc.includes('mobileExpanded'), 'ProductFilters includes collapsible mobile drawer disclosure');

const mobileNavSrc = fs.readFileSync('Zen/frontend/src/components/navigation/MobileNavigation.jsx', 'utf8');
assert(mobileNavSrc.includes('document.body.style.overflow'), 'MobileNavigation locks body scroll when drawer is open');

console.log(`\n=== AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}

