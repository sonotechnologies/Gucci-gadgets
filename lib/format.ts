/** The single price formatter for the whole site: 1450000 → "₦1,450,000". */
export function formatNaira(n: number): string {
  const v = Math.round(n);
  const sign = v < 0 ? "−" : "";
  return `${sign}₦${Math.abs(v).toLocaleString("en-US")}`;
}

/** Saving badge text: 120000 → "−₦120,000". */
export function formatSaving(n: number): string {
  return `−₦${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/** Sort key for storage labels ("64GB" < "128GB" < "1TB"). */
export function storageRank(s: string | null): number {
  if (!s) return 0;
  const m = /^(\d+(?:\.\d+)?)\s*(GB|TB)$/i.exec(s.trim());
  if (!m) return 0;
  return parseFloat(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1);
}

/** Short label for chips: "128GB" → "128", "1TB" → "1TB". */
export function storageShort(s: string): string {
  return /GB$/i.test(s) ? s.replace(/GB$/i, "") : s;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+/g, " plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h >= 48) return `${Math.floor(h / 24)}d ${pad2(h % 24)}h`;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}
