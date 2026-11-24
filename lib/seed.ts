/**
 * Placeholder seed data. Prices are ROUGH DEMO VALUES — check current Lagos
 * market prices before pitching. This file is the single source for both the
 * demo-mode catalogue (no Supabase configured) and supabase/seed.sql
 * (regenerate with `npm run seed:sql`).
 */
import { slugify } from "./format";
import type {
  Brand,
  Category,
  Condition,
  Grade,
  Product,
  RepairIssue,
  RepairPrice,
  Review,
  Settings,
  Specs,
  SwapValue,
  Tag,
  Variant,
} from "./types";

/**
 * Generic, logo-free product renders served from public/products/ (made by
 * scripts/gen-product-images.py). Phones get 3 shots, everything else 1.
 * Replace them with real photos from Admin → Products.
 */
function localImages(slug: string, category: Category): string[] {
  const n = category === "phone" ? 3 : 1;
  return Array.from({ length: n }, (_, i) => `/products/${slug}-${i + 1}.webp`);
}


/** Deterministic UUIDs so seed.sql and demo mode share ids. */
function uid(prefix: number, n: number): string {
  return `00000000-0000-4000-8${prefix.toString(16).padStart(3, "0")}-${n.toString(16).padStart(12, "0")}`;
}

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString();
const hoursAhead = (h: number) => new Date(now + h * 3_600_000).toISOString();

interface UsedInfo {
  grade: Grade;
  battery: number;
  warranty?: number;
  notes: string;
}

interface Def {
  name: string;
  brand: Brand;
  category: Category;
  condition: Condition;
  description: string;
  specs: Specs;
  /** [storage label or null, price, old price?] */
  storage: [string | null, number, number?][];
  colours: (string | null)[];
  stock?: number;
  used?: UsedInfo;
  tags?: Tag[];
  dealHours?: number;
  age: number; // days since added
}

const iosNet = "5G · Nano SIM + eSIM";
const dualNet = "5G · Dual SIM";

const DEFS: Def[] = [
  // ---------- New phones ----------
  {
    name: "iPhone 17 Pro Max",
    brand: "Apple",
    category: "phone",
    condition: "new",
    description: "Apple's biggest Pro with the longest battery life in an iPhone. Sealed in box, with a 12-month warranty.",
    specs: { display: '6.9" OLED, 120Hz ProMotion', chip: "A19 Pro", ram: "12GB", camera: "48MP main · 48MP ultra-wide · 48MP 4× telephoto", battery_mah: 4832, os: "iOS 26", network: iosNet },
    storage: [["256GB", 2650000], ["512GB", 3050000], ["1TB", 3500000]],
    colours: ["Cosmic Orange", "Deep Blue", "Silver"],
    tags: ["new_arrival", "best_seller"],
    age: 3,
  },
  {
    name: "iPhone 17 Pro",
    brand: "Apple",
    category: "phone",
    condition: "new",
    description: "Pro cameras and the A19 Pro chip in the 6.3-inch size. Sealed in box, with a 12-month warranty.",
    specs: { display: '6.3" OLED, 120Hz ProMotion', chip: "A19 Pro", ram: "12GB", camera: "48MP main · 48MP ultra-wide · 48MP 4× telephoto", battery_mah: 4252, os: "iOS 26", network: iosNet },
    storage: [["256GB", 2300000], ["512GB", 2700000], ["1TB", 3150000]],
    colours: ["Cosmic Orange", "Deep Blue", "Silver"],
    tags: ["new_arrival"],
    age: 5,
  },
  {
    name: "iPhone 17",
    brand: "Apple",
    category: "phone",
    condition: "new",
    description: "The everyday iPhone, now with a 120Hz display. Sealed in box, with a 12-month warranty.",
    specs: { display: '6.3" OLED, 120Hz ProMotion', chip: "A19", ram: "8GB", camera: "48MP main · 48MP ultra-wide", battery_mah: 3692, os: "iOS 26", network: iosNet },
    storage: [["256GB", 1650000], ["512GB", 2000000]],
    colours: ["Lavender", "Sage", "Mist Blue", "Black"],
    tags: ["new_arrival"],
    age: 6,
  },
  {
    name: "iPhone 16",
    brand: "Apple",
    category: "phone",
    condition: "new",
    description: "Last year's standard iPhone at a lower price. Camera Control button and Action button.",
    specs: { display: '6.1" OLED, 60Hz', chip: "A18", ram: "8GB", camera: "48MP main · 12MP ultra-wide", battery_mah: 3561, os: "iOS 26", network: iosNet },
    storage: [["128GB", 1180000, 1290000], ["256GB", 1380000, 1490000]],
    colours: ["Ultramarine", "Teal", "Black", "White"],
    tags: ["deal", "price_drop"],
    dealHours: 52,
    age: 40,
  },
  {
    name: "Galaxy S25 Ultra",
    brand: "Samsung",
    category: "phone",
    condition: "new",
    description: "Samsung's flagship with the built-in S Pen and a 200MP camera. Sealed in box.",
    specs: { display: '6.9" AMOLED, 120Hz', chip: "Snapdragon 8 Elite for Galaxy", ram: "12GB", camera: "200MP main · 50MP 5× · 10MP 3× · 50MP ultra-wide", battery_mah: 5000, os: "Android 16 · One UI 8", network: dualNet },
    storage: [["256GB", 1890000, 2050000], ["512GB", 2150000, 2300000]],
    colours: ["Titanium Silverblue", "Titanium Black", "Titanium Gray"],
    tags: ["deal", "best_seller"],
    dealHours: 4.2,
    age: 60,
  },
  {
    name: "Galaxy A56",
    brand: "Samsung",
    category: "phone",
    condition: "new",
    description: "A dependable mid-range Samsung with a big battery and six years of updates.",
    specs: { display: '6.7" AMOLED, 120Hz', chip: "Exynos 1580", ram: "8GB", camera: "50MP main · 12MP ultra-wide · 5MP macro", battery_mah: 5000, os: "Android 16 · One UI 8", network: dualNet },
    storage: [["128GB", 520000], ["256GB", 590000]],
    colours: ["Awesome Navy", "Awesome Lilac", "Gray"],
    age: 30,
  },
  {
    name: "Pixel 10",
    brand: "Google",
    category: "phone",
    condition: "new",
    description: "Google's clean Android with the best point-and-shoot camera in its class.",
    specs: { display: '6.3" OLED, 120Hz', chip: "Google Tensor G5", ram: "12GB", camera: "48MP main · 13MP ultra-wide · 10.8MP 5× telephoto", battery_mah: 4970, os: "Android 16", network: iosNet },
    storage: [["128GB", 1150000], ["256GB", 1300000]],
    colours: ["Obsidian", "Indigo", "Porcelain"],
    tags: ["new_arrival"],
    age: 9,
  },
  {
    name: "Tecno Camon 40 Pro",
    brand: "Tecno",
    category: "phone",
    condition: "new",
    description: "A slim, camera-first Tecno with fast charging and a curved AMOLED screen.",
    specs: { display: '6.78" AMOLED, 144Hz', chip: "MediaTek Helio G100 Ultimate", ram: "8GB", camera: "50MP main · 8MP ultra-wide", battery_mah: 5200, os: "Android 15 · HiOS 15", network: "4G · Dual SIM" },
    storage: [["256GB", 395000]],
    colours: ["Black", "Green"],
    age: 25,
  },
  {
    name: "Infinix Note 50 Pro",
    brand: "Infinix",
    category: "phone",
    condition: "new",
    description: "Big screen, big battery and 90W charging at a price that makes sense.",
    specs: { display: '6.78" AMOLED, 144Hz', chip: "MediaTek Helio G100 Ultimate", ram: "8GB", camera: "50MP main · 8MP ultra-wide", battery_mah: 5200, os: "Android 15 · XOS 15", network: "4G · Dual SIM" },
    storage: [["256GB", 365000, 395000]],
    colours: ["Gray", "Black"],
    tags: ["deal"],
    dealHours: 28,
    age: 35,
  },
  {
    name: "Redmi Note 14 Pro",
    brand: "Redmi",
    category: "phone",
    condition: "new",
    description: "A 200MP camera and an IP68 body for less than you'd expect.",
    specs: { display: '6.67" AMOLED, 120Hz', chip: "MediaTek Dimensity 7300 Ultra", ram: "8GB", camera: "200MP main · 8MP ultra-wide · 2MP macro", battery_mah: 5500, os: "Android 15 · HyperOS 2", network: dualNet },
    storage: [["256GB", 410000], ["512GB", 470000]],
    colours: ["Black", "Blue"],
    age: 50,
  },
  // ---------- UK-used ----------
  {
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    category: "phone",
    condition: "uk_used",
    description: "UK-used, tested and graded in our Lagos workshop. Comes with a written condition report.",
    specs: { display: '6.9" OLED, 120Hz ProMotion', chip: "A18 Pro", ram: "8GB", camera: "48MP main · 48MP ultra-wide · 12MP 5× telephoto", battery_mah: 4685, os: "iOS 26", network: iosNet },
    storage: [["256GB", 1780000, 1890000], ["512GB", 2020000]],
    colours: ["Desert Titanium", "Natural Titanium", "Black Titanium"],
    used: { grade: "A+", battery: 98, warranty: 6, notes: "No marks at all. Original screen, battery and cameras." },
    tags: ["deal"],
    dealHours: 4.2,
    age: 12,
  },
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    category: "phone",
    condition: "uk_used",
    description: "UK-used, tested and graded in our Lagos workshop. Comes with a written condition report.",
    specs: { display: '6.7" OLED, 120Hz ProMotion', chip: "A17 Pro", ram: "8GB", camera: "48MP main · 12MP ultra-wide · 12MP 5× telephoto", battery_mah: 4441, os: "iOS 26", network: iosNet },
    storage: [["256GB", 1450000, 1570000], ["512GB", 1640000]],
    colours: ["Natural Titanium", "Blue", "Black Titanium"],
    used: { grade: "A", battery: 92, warranty: 3, notes: "Faint mark on the frame, only visible up close. Original screen and battery." },
    tags: ["deal", "best_seller"],
    dealHours: 4.2,
    age: 20,
  },
  {
    name: "iPhone 15",
    brand: "Apple",
    category: "phone",
    condition: "uk_used",
    description: "UK-used, tested and graded in our Lagos workshop. Comes with a written condition report.",
    specs: { display: '6.1" OLED, 60Hz', chip: "A16 Bionic", ram: "6GB", camera: "48MP main · 12MP ultra-wide", battery_mah: 3349, os: "iOS 26", network: iosNet },
    storage: [["128GB", 820000], ["256GB", 930000]],
    colours: ["Pink", "Blue", "Black"],
    used: { grade: "A", battery: 90, warranty: 3, notes: "Clean screen and back. All functions tested." },
    tags: ["new_arrival"],
    age: 4,
  },
  {
    name: "iPhone 14 Pro",
    brand: "Apple",
    category: "phone",
    condition: "uk_used",
    description: "UK-used, tested and graded in our Lagos workshop. Comes with a written condition report.",
    specs: { display: '6.1" OLED, 120Hz ProMotion', chip: "A16 Bionic", ram: "6GB", camera: "48MP main · 12MP ultra-wide · 12MP 3× telephoto", battery_mah: 3200, os: "iOS 26", network: iosNet },
    storage: [["128GB", 760000], ["256GB", 850000]],
    colours: ["Deep Purple", "Space Black", "Gold"],
    used: { grade: "B", battery: 86, warranty: 3, notes: "Light scuffs on the frame, hidden by a case. Screen has no scratches." },
    age: 45,
  },
  {
    name: "iPhone 13",
    brand: "Apple",
    category: "phone",
    condition: "uk_used",
    description: "UK-used, tested and graded in our Lagos workshop. Comes with a written condition report.",
    specs: { display: '6.1" OLED, 60Hz', chip: "A15 Bionic", ram: "4GB", camera: "12MP main · 12MP ultra-wide", battery_mah: 3240, os: "iOS 26", network: iosNet },
    storage: [["128GB", 420000, 465000], ["256GB", 485000]],
    colours: ["Midnight", "Starlight", "Blue", "Pink"],
    used: { grade: "B", battery: 84, warranty: 3, notes: "Light marks on the back glass. Original screen, battery replaced by us with a genuine part." },
    tags: ["deal"],
    dealHours: 28,
    age: 70,
  },
  {
    name: "Galaxy S24 Ultra",
    brand: "Samsung",
    category: "phone",
    condition: "uk_used",
    description: "UK-used, tested and graded in our Lagos workshop. Comes with a written condition report.",
    specs: { display: '6.8" AMOLED, 120Hz', chip: "Snapdragon 8 Gen 3 for Galaxy", ram: "12GB", camera: "200MP main · 50MP 5× · 10MP 3× · 12MP ultra-wide", battery_mah: 5000, os: "Android 16 · One UI 8", network: dualNet },
    storage: [["256GB", 1150000], ["512GB", 1290000]],
    colours: ["Titanium Gray", "Titanium Black", "Violet"],
    used: { grade: "A", battery: 91, warranty: 3, notes: "S Pen included. No screen burn-in. Faint mark on one corner." },
    age: 16,
  },
  // ---------- Accessories ----------
  {
    name: "AirPods Pro 3",
    brand: "Apple",
    category: "accessory",
    condition: "new",
    description: "Active noise cancellation, heart-rate sensing and a USB-C MagSafe case.",
    specs: { connectivity: "Bluetooth 5.3 · H2 chip", battery_life: "Up to 8 hours (ANC on)" },
    storage: [[null, 420000, 455000]],
    colours: [null],
    tags: ["deal", "best_seller"],
    dealHours: 52,
    age: 22,
  },
  {
    name: "20W USB-C Charger",
    brand: "Apple",
    category: "accessory",
    condition: "new",
    description: "Original Apple 20W adapter. Fast-charges any iPhone from 8 onwards.",
    specs: { output: "20W USB-C PD", compatibility: "iPhone 8 and later, iPad" },
    storage: [[null, 18000]],
    colours: ["White"],
    stock: 40,
    age: 90,
  },
  {
    name: "35W Dual USB-C Charger",
    brand: "Apple",
    category: "accessory",
    condition: "new",
    description: "Charge a phone and a watch, or two phones, from one compact plug.",
    specs: { output: "35W shared across two USB-C ports", compatibility: "iPhone, iPad, AirPods, Apple Watch" },
    storage: [[null, 42000]],
    colours: ["White"],
    stock: 18,
    age: 90,
  },
  {
    name: "MagSafe Power Bank 5,000mAh",
    brand: "Other",
    category: "accessory",
    condition: "new",
    description: "Snaps onto the back of any MagSafe iPhone. Slim enough to leave on all day.",
    specs: { capacity: "5,000 mAh", output: "15W wireless · 20W USB-C", compatibility: "iPhone 12 and later" },
    storage: [[null, 38000]],
    colours: ["Black", "White"],
    stock: 15,
    age: 10,
  },
  {
    name: "20,000mAh Power Bank",
    brand: "Other",
    category: "accessory",
    condition: "new",
    description: "Two to four full phone charges. Essential for NEPA days.",
    specs: { capacity: "20,000 mAh", output: "22.5W USB-C PD · 2× USB-A" },
    storage: [[null, 29000]],
    colours: ["Black"],
    stock: 30,
    age: 60,
  },
  {
    name: "Clear MagSafe Case",
    brand: "Other",
    category: "accessory",
    condition: "new",
    description: "Crystal-clear case that won't yellow, with a built-in MagSafe ring.",
    specs: { compatibility: "iPhone 15, 16 and 17 series (choose at checkout)" },
    storage: [[null, 15000]],
    colours: ["Clear"],
    stock: 50,
    age: 60,
  },
  {
    name: "Tempered Glass Screen Protector",
    brand: "Other",
    category: "accessory",
    condition: "new",
    description: "9H glass with an easy-fit frame. We fit it free in store.",
    specs: { compatibility: "Most iPhone and Galaxy models" },
    storage: [[null, 7500]],
    colours: [null],
    stock: 80,
    age: 60,
  },
  // ---------- Gadgets ----------
  {
    name: "Apple Watch Series 11",
    brand: "Apple",
    category: "gadget",
    condition: "new",
    description: "Sleep score, blood-pressure alerts and all-day battery. 45mm GPS model.",
    specs: { display: "45mm Always-On Retina", battery_life: "Up to 24 hours", compatibility: "iPhone 11 and later" },
    storage: [[null, 620000]],
    colours: ["Black", "Silver"],
    stock: 6,
    tags: ["new_arrival"],
    age: 7,
  },
  {
    name: "JBL Flip 7 Speaker",
    brand: "Other",
    category: "gadget",
    condition: "new",
    description: "Waterproof, drop-proof Bluetooth speaker with 14 hours of playtime.",
    specs: { connectivity: "Bluetooth 5.4 · USB-C audio", battery_life: "Up to 14 hours" },
    storage: [[null, 165000, 185000]],
    colours: ["Black", "Blue"],
    stock: 9,
    tags: ["deal"],
    dealHours: 52,
    age: 28,
  },
];

function build(def: Def, i: number): Product {
  const id = uid(1, i + 1);
  const variants: Variant[] = [];
  let n = 0;
  for (const [storage, price, old] of def.storage) {
    for (const colour of def.colours) {
      n++;
      const qty = def.stock ?? (def.condition === "uk_used" ? 1 + ((i + n) % 3) : 3 + ((i * 3 + n) % 7));
      variants.push({
        id: uid(2, (i + 1) * 100 + n),
        product_id: id,
        storage,
        colour,
        price,
        old_price: old ?? null,
        in_stock: true,
        stock_qty: qty,
        grade: def.used?.grade ?? null,
        battery_health: def.used?.battery ?? null,
        warranty_months: def.used ? (def.used.warranty ?? 3) : def.category === "phone" ? 12 : 6,
        notes: def.used?.notes ?? null,
      });
    }
  }
  const slugBase = slugify(def.name);
  return {
    id,
    slug: def.condition === "uk_used" ? `${slugBase}-uk-used` : slugBase,
    name: def.name,
    brand: def.brand,
    category: def.category,
    condition: def.condition,
    description: def.description,
    specs: def.specs,
    images: localImages(def.condition === "uk_used" ? `${slugBase}-uk-used` : slugBase, def.category),
    tags: def.tags ?? [],
    deal_ends_at: def.dealHours ? hoursAhead(def.dealHours) : null,
    is_active: true,
    created_at: daysAgo(def.age),
    variants,
  };
}

export const SEED_PRODUCTS: Product[] = DEFS.map(build);

/** Used by the SQL generator to express dates relative to now(). */
export const SEED_DEF_TIMING = DEFS.map((d) => ({ age: d.age, dealHours: d.dealHours ?? null }));

// ---------- Swap values (base value = clean Grade A unit) ----------
const SWAP_TABLE: [string, string, [string, number][]][] = [
  ["Apple", "iPhone 11", [["64GB", 150000], ["128GB", 175000]]],
  ["Apple", "iPhone 11 Pro Max", [["64GB", 220000], ["256GB", 260000]]],
  ["Apple", "iPhone 12", [["64GB", 220000], ["128GB", 250000]]],
  ["Apple", "iPhone 12 Pro Max", [["128GB", 360000], ["256GB", 400000]]],
  ["Apple", "iPhone 13", [["128GB", 340000], ["256GB", 385000]]],
  ["Apple", "iPhone 13 Pro Max", [["128GB", 520000], ["256GB", 570000]]],
  ["Apple", "iPhone 14", [["128GB", 430000], ["256GB", 480000]]],
  ["Apple", "iPhone 14 Pro Max", [["128GB", 700000], ["256GB", 760000]]],
  ["Apple", "iPhone 15", [["128GB", 600000], ["256GB", 670000]]],
  ["Apple", "iPhone 15 Pro Max", [["256GB", 1050000], ["512GB", 1150000]]],
  ["Apple", "iPhone 16", [["128GB", 820000], ["256GB", 900000]]],
  ["Apple", "iPhone 16 Pro Max", [["256GB", 1350000], ["512GB", 1480000]]],
  ["Samsung", "Galaxy S21", [["128GB", 160000], ["256GB", 185000]]],
  ["Samsung", "Galaxy S21 Ultra", [["128GB", 260000], ["256GB", 290000]]],
  ["Samsung", "Galaxy S22", [["128GB", 230000], ["256GB", 255000]]],
  ["Samsung", "Galaxy S22 Ultra", [["256GB", 380000], ["512GB", 420000]]],
  ["Samsung", "Galaxy S23", [["128GB", 330000], ["256GB", 365000]]],
  ["Samsung", "Galaxy S23 Ultra", [["256GB", 580000], ["512GB", 640000]]],
  ["Samsung", "Galaxy S24", [["128GB", 470000], ["256GB", 520000]]],
  ["Samsung", "Galaxy S24 Ultra", [["256GB", 820000], ["512GB", 900000]]],
];

export const SEED_SWAP_VALUES: SwapValue[] = SWAP_TABLE.flatMap(([brand, model, sizes], i) =>
  sizes.map(([storage, base_value], j) => ({
    id: uid(3, i * 10 + j + 1),
    brand,
    model,
    storage,
    base_value,
    is_active: true,
  })),
);

// ---------- Repair prices ----------
const REPAIR_MODELS: [string, string, number][] = [
  ["Apple", "iPhone 11", 0.55],
  ["Apple", "iPhone 12", 0.7],
  ["Apple", "iPhone 13", 0.8],
  ["Apple", "iPhone 14 Pro", 1.15],
  ["Apple", "iPhone 15 Pro Max", 1.5],
  ["Apple", "iPhone 16 Pro Max", 1.8],
  ["Samsung", "Galaxy S22 Ultra", 1.0],
  ["Samsung", "Galaxy S23 Ultra", 1.25],
  ["Samsung", "Galaxy S24 Ultra", 1.5],
  ["Samsung", "Galaxy A55", 0.5],
];
const REPAIR_BASE: [RepairIssue, number, string][] = [
  ["Screen", 180000, "Same day"],
  ["Battery", 55000, "Same day"],
  ["Charging port", 40000, "Same day"],
];
const EXTRA_REPAIRS: [string, string, RepairIssue, number, string][] = [
  ["Apple", "iPhone 13", "Back glass", 60000, "1–2 days"],
  ["Apple", "iPhone 13", "Face ID", 95000, "2–3 days"],
  ["Apple", "iPhone 14 Pro", "Camera", 120000, "1–2 days"],
  ["Apple", "iPhone 15 Pro Max", "Back glass", 110000, "1–2 days"],
  ["Apple", "iPhone 15 Pro Max", "Water damage", 70000, "2–3 days"],
  ["Samsung", "Galaxy S24 Ultra", "Camera", 150000, "1–2 days"],
  ["Samsung", "Galaxy S23 Ultra", "Back glass", 65000, "1–2 days"],
];

export const SEED_REPAIR_PRICES: RepairPrice[] = [
  ...REPAIR_MODELS.flatMap(([brand, model, k], i) =>
    REPAIR_BASE.map(([issue, base, duration], j) => ({
      id: uid(4, i * 10 + j + 1),
      brand,
      model,
      issue,
      price_from: Math.round((base * (issue === "Screen" ? k : 0.6 + k * 0.4)) / 5000) * 5000,
      duration,
    })),
  ),
  ...EXTRA_REPAIRS.map(([brand, model, issue, price_from, duration], i) => ({
    id: uid(4, 500 + i),
    brand,
    model,
    issue,
    price_from,
    duration,
  })),
];

export const SEED_SETTINGS: Settings = {
  whatsapp_number: "2349130928293",
  store_address: "Computer Village, Ikeja, Lagos (placeholder)",
  opening_hours: "Mon–Sat 9am–7pm",
  delivery_note: "Same-day delivery in Lagos. Nationwide delivery in 1–3 days.",
  instagram_handle: "guccigadgets",
};

export const SEED_REVIEWS: Review[] = [
  { id: uid(5, 1), name: "Tolu A.", area: "Lekki", rating: 5, text: "Bought a UK-used 14 Pro. The condition report matched exactly, battery at 89% like they said. No stories." },
  { id: uid(5, 2), name: "Chinedu O.", area: "Ikeja", rating: 5, text: "Swapped my 12 Pro Max for a 15 Pro Max. The estimate online was within ₦20k of the final offer." },
  { id: uid(5, 3), name: "Funmi B.", area: "Yaba", rating: 5, text: "Screen fixed the same afternoon. They showed me the old part and the new one before closing it up." },
  { id: uid(5, 4), name: "Ibrahim S.", area: "Surulere", rating: 4, text: "Delivery took one extra day, but they kept me updated on WhatsApp the whole time. Phone was perfect." },
  { id: uid(5, 5), name: "Ada N.", area: "Victoria Island", rating: 5, text: "First time buying a phone online in Lagos without fear. Sealed box, receipt, warranty card." },
  { id: uid(5, 6), name: "Kunle F.", area: "Ajah", rating: 5, text: "Prices are fair and they don't rush you. Ordered on WhatsApp at 9pm, phone arrived by noon." },
];
