export type Category = "phone" | "accessory" | "gadget";
export type Condition = "new" | "uk_used";
export type Grade = "A+" | "A" | "B";
export type Tag = "deal" | "new_arrival" | "price_drop" | "best_seller";

export const BRANDS = ["Apple", "Samsung", "Google", "Tecno", "Infinix", "Redmi", "Other"] as const;
export type Brand = (typeof BRANDS)[number];

export const TAGS: Tag[] = ["deal", "new_arrival", "price_drop", "best_seller"];

export interface Specs {
  display?: string;
  chip?: string;
  ram?: string;
  camera?: string;
  battery_mah?: number;
  os?: string;
  network?: string;
  [key: string]: string | number | undefined;
}

export interface Variant {
  id: string;
  product_id: string;
  storage: string | null; // "128GB", "1TB"; null for accessories without storage
  colour: string | null;
  price: number; // integer naira
  old_price: number | null;
  in_stock: boolean;
  stock_qty: number;
  // UK-used details
  grade: Grade | null;
  battery_health: number | null;
  warranty_months: number | null;
  notes: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: Brand;
  category: Category;
  condition: Condition;
  description: string;
  specs: Specs;
  images: string[];
  tags: Tag[];
  deal_ends_at: string | null;
  is_active: boolean;
  created_at: string;
  variants: Variant[];
}

export interface SwapValue {
  id: string;
  brand: string;
  model: string;
  storage: string;
  base_value: number;
  is_active: boolean;
}

export const REPAIR_ISSUES = [
  "Screen",
  "Battery",
  "Charging port",
  "Back glass",
  "Camera",
  "Face ID",
  "Water damage",
] as const;
export type RepairIssue = (typeof REPAIR_ISSUES)[number];

export interface RepairPrice {
  id: string;
  brand: string;
  model: string;
  issue: RepairIssue;
  price_from: number;
  duration: string;
}

export interface Settings {
  whatsapp_number: string; // international format, digits only, e.g. 2349130928293
  store_address: string;
  opening_hours: string;
  delivery_note: string;
  instagram_handle: string;
}

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  area: string;
}
