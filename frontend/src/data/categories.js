/**
 * Zen Global Marketplace Category Architecture
 * Kept cleanly separated from presentation components and AI logic so a backend
 * `/api/categories` endpoint can replace or hydrate this catalog seamlessly.
 */

export const MARKETPLACE_CATEGORIES = [
  {
    slug: 'electronics',
    name: 'Electronics',
    shortName: 'Electronics',
    placement: 'primary',
    tagline: 'Headphones, cameras, laptops & audio gear from Japan, US & EU.',
    imageUrl: '/images/products/sony-xm5.jpg',
    subcategories: [
      'Headphones & Audio',
      'Cameras & Optics',
      'Laptops & Computing',
      'Keyboards & Peripherals',
      'Gaming Consoles',
      'E-Readers',
    ],
    keywords: [
      'electronics', 'laptop', 'ultrabook', 'macbook', 'headphone', 'headphones',
      'xm5', 'xm4', 'airpods', 'camera', 'fujifilm', 'kindle', 'switch', 'keyboard',
      'speaker', 'audio', 'marshall', 'anker', 'charger',
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    shortName: 'Fashion',
    placement: 'primary',
    tagline: 'Tailored outerwear, minimalist sneakers, watches & studio apparel.',
    imageUrl: '/images/products/fashion-outerwear.jpg',
    subcategories: [
      'Outerwear & Coats',
      'Sneakers & Footwear',
      'Watches & Leather Goods',
      'Knitwear & Denim',
    ],
    keywords: [
      'fashion', 'jacket', 'coat', 'outerwear', 'watch', 'apparel', 'sneaker',
      'denim', 'shirt', 'barbour', 'seiko', 'bag', 'leather',
    ],
  },
  {
    slug: 'home-kitchen',
    name: 'Home & Kitchen',
    shortName: 'Home & Kitchen',
    placement: 'primary',
    tagline: 'Precision espresso machines, pour-over hardware & German appliances.',
    imageUrl: '/images/products/espresso-machine.jpg',
    subcategories: [
      'Espresso & Coffee Machines',
      'Pour-Over & Kettles',
      'Cookware & Knives',
      'Air & Home Appliances',
    ],
    keywords: [
      'home', 'kitchen', 'coffee', 'espresso', 'machine', 'grinder', 'kettle',
      'cookware', 'pan', 'knife', 'blender', 'appliance',
    ],
  },
  {
    slug: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    shortName: 'Beauty',
    placement: 'primary',
    tagline: 'K-Beauty serums, Japanese SPF & precision hair styling.',
    imageUrl: '/images/products/skincare-serum.jpg',
    subcategories: [
      'Serums & Treatments',
      'Sunscreen & Moisturizers',
      'Hair Styling Hardware',
      'Cleansers & Toners',
    ],
    keywords: [
      'beauty', 'skincare', 'serum', 'sunscreen', 'spf', 'moisturizer', 'cosrx',
      'korean', 'k-beauty', 'hair', 'dyson', 'airwrap', 'cleanser', 'cream',
    ],
  },
  {
    slug: 'books',
    name: 'Books',
    shortName: 'Books',
    placement: 'primary',
    tagline: 'Design monographs, architecture editions, manga & Japanese print.',
    imageUrl: '/images/products/design-books.jpg',
    subcategories: [
      'Design & Architecture',
      'Technology & Craft',
      'Art Monographs',
      'Imported Manga & Fiction',
    ],
    keywords: [
      'book', 'books', 'monograph', 'design', 'architecture', 'manga', 'hardcover',
      'novel', 'reading', 'taschen', 'phat',
    ],
  },
  {
    slug: 'sports-outdoors',
    name: 'Sports & Outdoors',
    shortName: 'Sports',
    placement: 'primary',
    tagline: 'Carbon-plated Japanese running shoes, trail gear & GPS fitness.',
    imageUrl: '/images/products/running-shoes.jpg',
    subcategories: [
      'Running Shoes',
      'Training & Marathon Gear',
      'Camping & Hydration',
      'Cycling Electronics',
    ],
    keywords: [
      'sport', 'sports', 'outdoor', 'running', 'shoes', 'sneakers', 'asics',
      'marathon', 'fitness', 'cycling', 'camping', 'garmin', 'trail',
    ],
  },
  {
    slug: 'toys-games',
    name: 'Toys & Games',
    shortName: 'Toys & Games',
    placement: 'primary',
    tagline: 'Collector architectural kits, tabletop editions & retro consoles.',
    imageUrl: '/images/products/toys-collector.jpg',
    subcategories: [
      'Collector Building Kits',
      'Board & Tabletop Games',
      'Handheld Gaming',
      'Scale Models',
    ],
    keywords: [
      'toy', 'toys', 'game', 'games', 'model', 'kit', 'puzzle', 'board', 'lego',
      'collectible', 'nintendo', 'figure',
    ],
  },
  {
    slug: 'grocery',
    name: 'Grocery',
    shortName: 'Grocery',
    placement: 'primary',
    tagline: 'First-harvest Uji ceremonial matcha, single-estate oils & pantry.',
    imageUrl: '/images/products/ceremonial-matcha.jpg',
    subcategories: [
      'Matcha & Japanese Tea',
      'Specialty Coffee Beans',
      'Artisanal Pantry & Oils',
      'Regional Confections',
    ],
    keywords: [
      'grocery', 'food', 'matcha', 'tea', 'coffee beans', 'olive oil', 'chocolate',
      'snack', 'pantry', 'uji', 'artisan',
    ],
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    shortName: 'Automotive',
    placement: 'primary',
    tagline: 'Dual-channel 4K dashcams, OBD telemetry & roadside emergency tech.',
    imageUrl: '/images/products/automotive-dashcam.jpg',
    subcategories: [
      '4K Dashcams',
      'OBD2 Diagnostics',
      'Portable Jump Starters',
      'Cabin Air & Care',
    ],
    keywords: [
      'auto', 'automotive', 'car', 'dashcam', 'viofo', 'garmin', 'obd', 'tire',
      'vehicle', 'charger',
    ],
  },
  {
    slug: 'baby-kids',
    name: 'Baby & Kids',
    shortName: 'Baby & Kids',
    placement: 'more',
    tagline: 'Ergonomic baby carriers, BPA-free glass feeding & travel gear.',
    imageUrl: '/images/products/baby-carrier.jpg',
    subcategories: [
      'Ergonomic Carriers',
      'Feeding & Sterilization',
      'Compact Strollers',
      'Nursery Monitors',
    ],
    keywords: [
      'baby', 'kid', 'kids', 'infant', 'stroller', 'carrier', 'bottle', 'feeding',
      'toddler', 'nursery',
    ],
  },
  {
    slug: 'office-products',
    name: 'Office Products',
    shortName: 'Office',
    placement: 'more',
    tagline: 'Japanese fountain pens, lay-flat Tomoe River planners & desk gear.',
    imageUrl: '/images/products/office-stationery.jpg',
    subcategories: [
      'Planners & Paper',
      'Fountain Pens',
      'Desk Organizers',
      'Monitor & Laptop Stands',
    ],
    keywords: [
      'office', 'desk', 'pen', 'fountain pen', 'notebook', 'planner', 'stationery',
      'hobonichi', 'pilot', 'stand',
    ],
  },
  {
    slug: 'pet-supplies',
    name: 'Pet Supplies',
    shortName: 'Pet Supplies',
    placement: 'more',
    tagline: 'App-controlled automatic feeders, smart fountains & harnesses.',
    imageUrl: '/images/products/travel-backpack.jpg',
    subcategories: [
      'Smart Feeders & Fountains',
      'Walking Harnesses',
      'Grooming Hardware',
      'Travel Carriers',
    ],
    keywords: [
      'pet', 'pets', 'dog', 'cat', 'feeder', 'fountain', 'collar', 'harness',
      'grooming', 'treat',
    ],
  },
  {
    slug: 'health-personal-care',
    name: 'Health & Personal Care',
    shortName: 'Health',
    placement: 'more',
    tagline: 'Magnetic-drive sonic toothbrushes, recovery tools & air monitors.',
    imageUrl: '/images/products/dyson-airwrap.jpg',
    subcategories: [
      'Oral Care Technology',
      'Percussive Recovery',
      'Home Diagnostics',
      'Air & Sleep Quality',
    ],
    keywords: [
      'health', 'wellness', 'toothbrush', 'oral-b', 'massage', 'theragun',
      'recovery', 'monitor', 'blood pressure',
    ],
  },
  {
    slug: 'musical-instruments',
    name: 'Musical Instruments',
    shortName: 'Music Gear',
    placement: 'more',
    tagline: 'Portable synthesizers, studio monitors & boutique audio pedals.',
    imageUrl: '/images/products/desktop-synth.jpg',
    subcategories: [
      'Synthesizers & Samplers',
      'MIDI Controllers',
      'Studio Monitors',
      'Recording Microphones',
    ],
    keywords: [
      'music', 'musical', 'instrument', 'synth', 'synthesizer', 'midi', 'guitar',
      'pedal', 'studio', 'microphone', 'piano', 'roland',
    ],
  },
  {
    slug: 'travel-accessories',
    name: 'Travel Accessories',
    shortName: 'Travel',
    placement: 'more',
    tagline: 'Carry-on weatherproof packs, compression cubes & GaN adapters.',
    imageUrl: '/images/products/travel-backpack.jpg',
    subcategories: [
      'Carry-On Backpacks',
      'Global GaN Power',
      'Packing Organizers',
      'Passport & Tech Slings',
    ],
    keywords: [
      'travel', 'backpack', 'luggage', 'carry-on', 'pack', 'adapter', 'sling',
      'packing cube', 'peak design', 'nomatic', 'bag',
    ],
  },
];

export function getAllCategories() {
  return MARKETPLACE_CATEGORIES;
}

export function getPrimaryNavCategories() {
  return MARKETPLACE_CATEGORIES.filter((c) => c.placement === 'primary');
}

export function getOverflowNavCategories() {
  return MARKETPLACE_CATEGORIES.filter((c) => c.placement === 'more');
}

export function getCategoryBySlug(slug) {
  if (!slug || slug === 'ALL') return null;
  const normalized = String(slug).trim().toLowerCase();
  return (
    MARKETPLACE_CATEGORIES.find(
      (c) => c.slug === normalized || c.name.toLowerCase() === normalized
    ) || null
  );
}

export function matchCategoriesFromText(text) {
  const lower = String(text || '').toLowerCase();
  if (!lower) return [];
  return MARKETPLACE_CATEGORIES.filter(
    (cat) =>
      lower.includes(cat.name.toLowerCase()) ||
      cat.keywords.some((kw) => lower.includes(kw))
  );
}
