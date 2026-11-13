import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_ORIGIN = 'https://zen.global';
const DEFAULT_TITLE = 'Zen – AI-Powered Borderless Shopping with PayPal';
const DEFAULT_DESC =
  'Shop globally with Zen, your AI-powered borderless buying assistant. Compare international products, understand currency conversions and estimated landed costs, and checkout securely with PayPal.';
const DEFAULT_IMAGE = `${DEFAULT_ORIGIN}/assets/branding/zen-og-card.png`;

function setMetaTag(selector, attrName, attrValue, content) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLinkTag(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function SEOHead({
  title,
  description = DEFAULT_DESC,
  keywords,
  canonical,
  robots = 'index, follow, max-image-preview:large',
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  jsonLd,
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Title
    const formattedTitle = title
      ? title.includes('Zen')
        ? title
        : `${title} | Zen Global`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Canonical URL
    const canonicalUrl = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${DEFAULT_ORIGIN}${canonical}`
      : `${DEFAULT_ORIGIN}${location.pathname}`;
    setLinkTag('canonical', canonicalUrl);

    // 3. Standard SEO Meta
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    if (keywords) {
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    }
    setMetaTag('meta[name="robots"]', 'name', 'robots', robots);

    // 4. Open Graph Metadata
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Zen Global');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');

    // 5. Twitter / X Card Metadata
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:site"]', 'name', 'twitter:site', '@ZenGlobal');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 6. Structured Data (JSON-LD)
    const existingScript = document.head.querySelector('script#zen-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'zen-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      // Clean up structured data on component unmount
      const script = document.head.querySelector('script#zen-structured-data');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, keywords, canonical, robots, ogType, ogImage, jsonLd, location.pathname]);

  return null;
}

export default SEOHead;

