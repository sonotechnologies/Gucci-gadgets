"use client";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/lib/admin/actions";
import { uploadProductImage } from "@/lib/admin/image";
import { SPEC_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/format";
import { BRANDS, TAGS, type Category, type Condition, type Product, type Tag } from "@/lib/types";
import { ProductImage } from "../product-image";
import { Segmented, Switch } from "../ui";
import { AdminCard, useAdminToast, useReport } from "./admin-ui";

interface VariantRow {
  id?: string;
  storage: string;
  colour: string;
  price: string;
  old_price: string;
  in_stock: boolean;
  stock_qty: string;
  grade: string;
  battery_health: string;
  warranty_months: string;
  notes: string;
}

const TAG_LABELS: Record<Tag, string> = { deal: "Flash deal", new_arrival: "New arrival", price_drop: "Price drop", best_seller: "Best seller" };
const PHONE_SPECS = ["display", "chip", "ram", "camera", "battery_mah", "os", "network"];

const emptyVariant = (condition: Condition, category: Category): VariantRow => ({
  storage: category === "phone" ? "128GB" : "",
  colour: "",
  price: "",
  old_price: "",
  in_stock: true,
  stock_qty: "1",
  grade: condition === "uk_used" ? "A" : "",
  battery_health: condition === "uk_used" ? "90" : "",
  warranty_months: condition === "uk_used" ? "3" : category === "phone" ? "12" : "6",
  notes: "",
});

/** ISO → value for <input type="datetime-local"> in the viewer's timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">{title}</h2>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="text-[13px] text-deal">{msg}</span> : null;
}

export function ProductForm({ product }: { product: Product | null }) {
  const router = useRouter();
  const report = useReport();
  const toast = useAdminToast((s) => s.show);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [brand, setBrand] = useState<string>(product?.brand ?? "Apple");
  const [category, setCategory] = useState<Category>(product?.category ?? "phone");
  const [condition, setCondition] = useState<Condition>(product?.condition ?? "new");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [tags, setTags] = useState<Tag[]>(product?.tags ?? []);
  const [dealEnds, setDealEnds] = useState(toLocalInput(product?.deal_ends_at ?? null));
  const [active, setActive] = useState(product?.is_active ?? true);
  const [specs, setSpecs] = useState<[string, string][]>(() => {
    const s = Object.entries(product?.specs ?? {}).map(([k, v]) => [k, String(v ?? "")] as [string, string]);
    return s.length ? s : PHONE_SPECS.map((k) => [k, ""] as [string, string]);
  });
  const [variants, setVariants] = useState<VariantRow[]>(() =>
    product?.variants.length
      ? product.variants.map((v) => ({
          id: v.id,
          storage: v.storage ?? "",
          colour: v.colour ?? "",
          price: String(v.price),
          old_price: v.old_price == null ? "" : String(v.old_price),
          in_stock: v.in_stock,
          stock_qty: String(v.stock_qty),
          grade: v.grade ?? "",
          battery_health: v.battery_health == null ? "" : String(v.battery_health),
          warranty_months: v.warranty_months == null ? "" : String(v.warranty_months),
          notes: v.notes ?? "",
        }))
      : [emptyVariant("new", "phone")],
  );
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const used = condition === "uk_used";

  const setV = (i: number, patch: Partial<VariantRow>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  const onFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const url = await uploadProductImage(f, slug || slugify(name));
        setImages((im) => [...im, url]);
      } catch (e) {
        toast(e instanceof Error ? `Upload failed: ${e.message}` : "Upload failed", "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const move = (i: number, d: -1 | 1) =>
    setImages((im) => {
      const j = i + d;
      if (j < 0 || j >= im.length) return im;
      const c = [...im];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const submit = () => {
    const specObj: Record<string, string | number> = {};
    specs.forEach(([k, v]) => {
      const key = k.trim();
      if (!key || !v.trim()) return;
      specObj[key] = key === "battery_mah" && /^\d+$/.test(v.trim()) ? Number(v.trim()) : v.trim();
    });
    const payload = {
      id: product?.id,
      name,
      slug: slug || slugify(name),
      brand,
      category,
      condition,
      description,
      specs: specObj,
      images,
      tags,
      deal_ends_at: dealEnds ? new Date(dealEnds).toISOString() : "",
      is_active: active,
      variants: variants.map((v) => ({
        ...v,
        price: v.price.replace(/[^\d]/g, ""),
        old_price: v.old_price.replace(/[^\d]/g, ""),
        grade: used ? v.grade : "",
        battery_health: used ? v.battery_health : "",
      })),
    };
    start(async () => {
      const r = await saveProduct(payload);
      setErrors(r.ok ? {} : (r.fieldErrors ?? {}));
      if (report(r, product ? "Product saved" : "Product added") && r.ok && !product && r.id) router.replace(`/admin/products/${r.id}`);
      else if (r.ok) router.refresh();
    });
  };

  const remove = () => {
    if (!product || !confirm(`Delete ${product.name}? This can't be undone.`)) return;
    start(async () => {
      const r = await deleteProduct(product.id);
      report(r, "Product deleted");
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
    >
      <AdminCard className="flex max-w-[760px] flex-col gap-7 p-5 md:p-6">
        <Section title="Basics">
          <label className="field">
            Product name
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value) + (condition === "uk_used" ? "-uk-used" : ""));
              }}
              placeholder="iPhone 15 Pro"
              required
            />
            <Err msg={errors.name} />
          </label>
          <label className="field">
            Web address
            <div className="flex items-center rounded-btn border border-border bg-surface-2">
              <span className="pl-3 text-small text-muted">/product/</span>
              <input
                className="h-11 min-w-0 flex-1 bg-transparent pr-3 font-mono text-[15px] text-text outline-none"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                placeholder="iphone-15-pro"
              />
            </div>
            <Err msg={errors.slug} />
          </label>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="field">
              Brand
              <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
                {BRANDS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Category
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                <option value="phone">Phone</option>
                <option value="accessory">Accessory</option>
                <option value="gadget">Gadget</option>
              </select>
            </label>
          </div>
          <div className="field">
            Condition
            <Segmented
              label="Condition"
              value={condition}
              onChange={(c) => {
                setCondition(c);
                if (c === "uk_used") setVariants((vs) => vs.map((v) => ({ ...v, grade: v.grade || "A", battery_health: v.battery_health || "90", warranty_months: v.warranty_months || "3" })));
              }}
              options={[
                { value: "new", label: "New" },
                { value: "uk_used", label: "UK-used" },
              ]}
            />
          </div>
          <label className="field">
            Description
            <textarea className="input h-auto min-h-[96px] py-2.5" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short, plain description buyers will read." />
          </label>
        </Section>

        <Section title="Photos" hint="First photo is the main one. Photos are compressed in your browser before upload.">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
            role="button"
            tabIndex={0}
            className={cn(
              "flex h-[120px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed text-small text-muted transition-colors",
              drag ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-surface",
            )}
          >
            <ImagePlus size={24} strokeWidth={1.5} />
            {uploading ? `Uploading ${uploading}…` : "Drop photos or tap to upload"}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && onFiles(e.target.files)} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((src, i) => (
                <div key={src + i} className="flex flex-col gap-1">
                  <div className="relative">
                    <ProductImage src={src} alt={`Photo ${i + 1}`} sizes="160px" className="aspect-square rounded-btn" />
                    <button type="button" onClick={() => setImages((im) => im.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg">
                        <X size={14} strokeWidth={1.75} />
                      </span>
                    </button>
                    {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-bg px-1.5 text-micro font-medium">Main</span>}
                  </div>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="icon-btn h-9 w-9 disabled:opacity-30">
                      <ArrowLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move right" className="icon-btn h-9 w-9 disabled:opacity-30">
                      <ArrowRight size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Price and stock" hint={used ? "Each variant is a unit you can sell, with its own condition report." : "One row per storage and colour you sell."}>
          {errors.variants && <Err msg={errors.variants} />}
          <div className="flex flex-col gap-4">
            {variants.map((v, i) => (
              <div key={v.id ?? i} className="flex flex-col gap-3 rounded-card border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-small font-semibold">Variant {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-muted">In stock</span>
                    <Switch checked={v.in_stock} onChange={(on) => setV(i, { in_stock: on })} label={`Variant ${i + 1} in stock`} />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} aria-label={`Remove variant ${i + 1}`} className="icon-btn text-muted">
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field">
                    Storage
                    <input className="input font-mono" value={v.storage} onChange={(e) => setV(i, { storage: e.target.value })} placeholder="256GB" />
                  </label>
                  <label className="field">
                    Colour
                    <input className="input" value={v.colour} onChange={(e) => setV(i, { colour: e.target.value })} placeholder="Black" />
                  </label>
                  <label className="field">
                    Price (₦)
                    <input className="input font-mono" inputMode="numeric" value={v.price} onChange={(e) => setV(i, { price: e.target.value })} required />
                    <Err msg={errors[`variants.${i}.price`]} />
                  </label>
                  <label className="field">
                    Old price (shows a deal)
                    <input className="input font-mono" inputMode="numeric" value={v.old_price} onChange={(e) => setV(i, { old_price: e.target.value })} placeholder="optional" />
                  </label>
                  <label className="field">
                    Units in stock
                    <input className="input font-mono" inputMode="numeric" value={v.stock_qty} onChange={(e) => setV(i, { stock_qty: e.target.value })} />
                  </label>
                  <label className="field">
                    Warranty (months)
                    <input className="input font-mono" inputMode="numeric" value={v.warranty_months} onChange={(e) => setV(i, { warranty_months: e.target.value })} />
                  </label>
                </div>
                {used && (
                  <div className="flex flex-col gap-3 border-t border-border pt-3">
                    <span className="text-[13px] font-semibold">Condition report</span>
                    <div className="field">
                      Grade
                      <Segmented label="Grade" value={v.grade || "A"} onChange={(g) => setV(i, { grade: g })} options={["A+", "A", "B"].map((g) => ({ value: g, label: `Grade ${g}` }))} />
                      <Err msg={errors[`variants.${i}.grade`]} />
                    </div>
                    <label className="field">
                      Battery health (%)
                      <input className="input font-mono" inputMode="numeric" value={v.battery_health} onChange={(e) => setV(i, { battery_health: e.target.value })} />
                      <Err msg={errors[`variants.${i}.battery_health`]} />
                    </label>
                    <label className="field">
                      Condition notes
                      <textarea
                        className="input h-auto min-h-[72px] py-2.5"
                        rows={3}
                        value={v.notes}
                        onChange={(e) => setV(i, { notes: e.target.value })}
                        placeholder="Light marks on the frame. Original screen and battery."
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setVariants((vs) => [...vs, { ...(vs[vs.length - 1] ?? emptyVariant(condition, category)), id: undefined, colour: "" }])}
              className="btn btn-secondary self-start"
            >
              <Plus size={16} strokeWidth={1.75} />
              Add variant
            </button>
          </div>
        </Section>

        <Section title="Specs" hint="Shown on the product page and the compare table.">
          <div className="flex flex-col gap-2.5">
            {specs.map(([k, v], i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_44px] gap-2">
                <input
                  className="input text-small"
                  value={k}
                  onChange={(e) => setSpecs((s) => s.map((row, j) => (j === i ? [e.target.value, row[1]] : row)))}
                  aria-label="Spec name"
                  placeholder="display"
                  list="spec-keys"
                />
                <input
                  className="input text-small"
                  value={v}
                  onChange={(e) => setSpecs((s) => s.map((row, j) => (j === i ? [row[0], e.target.value] : row)))}
                  aria-label={`${SPEC_LABELS[k] ?? k} value`}
                  placeholder={k === "battery_mah" ? "4685" : ""}
                />
                <button type="button" onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))} aria-label="Remove spec" className="icon-btn text-muted">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            ))}
            <datalist id="spec-keys">
              {Object.keys(SPEC_LABELS).map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <button type="button" onClick={() => setSpecs((s) => [...s, ["", ""]])} className="btn btn-ghost self-start px-2 text-accent">
              <Plus size={16} strokeWidth={1.75} />
              Add spec
            </button>
          </div>
        </Section>

        <Section title="Tags and deals">
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags((ts) => (on ? ts.filter((x) => x !== t) : [...ts, t]))}
                  className={cn("h-10 rounded-full border px-4 text-small font-medium", on ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                >
                  {TAG_LABELS[t]}
                </button>
              );
            })}
          </div>
          {tags.includes("deal") && (
            <label className="field max-w-xs">
              Deal ends
              <input className="input" type="datetime-local" value={dealEnds} onChange={(e) => setDealEnds(e.target.value)} />
              <span className="text-micro">Leave empty for a deal with no countdown.</span>
            </label>
          )}
          <p className="text-[13px] text-muted">Price-drop badges show automatically when a variant has an old price higher than its price.</p>
        </Section>

        <Section title="Visibility">
          <label className="flex items-center justify-between gap-3 text-[15px]">
            Show on the website
            <Switch checked={active} onChange={setActive} label="Show on the website" />
          </label>
        </Section>
      </AdminCard>

      <div className="sticky bottom-[76px] z-10 flex max-w-[760px] items-center justify-between gap-3 rounded-card border border-border bg-bg p-3 shadow-float md:bottom-4">
        {product ? (
          <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost text-deal">
            <Trash2 size={16} strokeWidth={1.5} />
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Link href="/admin/products" className="btn btn-secondary hover:no-underline">
            Cancel
          </Link>
          <button type="submit" disabled={pending || uploading > 0} className="btn btn-primary">
            {pending ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </form>
  );
}
