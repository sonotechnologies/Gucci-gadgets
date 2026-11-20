"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SwapValue } from "@/lib/types";

export function MiniEstimator({ values }: { values: SwapValue[] }) {
  const router = useRouter();
  const brands = useMemo(() => [...new Set(values.map((v) => v.brand))], [values]);
  const [brand, setBrand] = useState(brands[0] ?? "Apple");
  const models = useMemo(() => [...new Set(values.filter((v) => v.brand === brand).map((v) => v.model))], [values, brand]);
  const [model, setModel] = useState(models[0] ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/swap?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
      }}
      className="grid grid-cols-1 items-end gap-3 rounded-card bg-bg p-5 sm:grid-cols-[1fr_1fr_auto]"
    >
      <label className="field">
        Brand
        <select
          className="input"
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            const first = values.find((v) => v.brand === e.target.value);
            setModel(first?.model ?? "");
          }}
        >
          {brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Model
        <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
          {models.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn-primary">
        Get estimate
      </button>
    </form>
  );
}
