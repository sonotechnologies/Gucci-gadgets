"use client";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteSwapValue, saveSwapValue } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import { CONDITION_MULTIPLIERS, DEDUCTIONS } from "@/lib/swap";
import type { SwapValue } from "@/lib/types";
import { Switch } from "../ui";
import { AdminCard, useReport } from "./admin-ui";

function ValueInput({ row, onSaved }: { row: SwapValue; onSaved: (v: number) => void }) {
  const [val, setVal] = useState(String(row.base_value));
  const [pending, start] = useTransition();
  const report = useReport();
  return (
    <input
      value={val}
      inputMode="numeric"
      aria-label={`Base value for ${row.model} ${row.storage}`}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      onBlur={() => {
        const n = Number(val.replace(/[^\d]/g, ""));
        if (!val || n === row.base_value) return setVal(String(row.base_value));
        start(async () => {
          if (report(await saveSwapValue({ ...row, base_value: n }), "Swap value saved")) onSaved(n);
          else setVal(String(row.base_value));
        });
      }}
      className={cn("num h-10 w-full rounded-lg border border-border bg-surface-2 px-2.5 text-[15px]", pending && "opacity-50")}
    />
  );
}

export function SwapTable({ values: initial }: { values: SwapValue[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ brand: "Apple", model: "", storage: "128GB", base_value: "" });
  const [pending, start] = useTransition();
  const report = useReport();

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => !t || `${r.brand} ${r.model} ${r.storage}`.toLowerCase().includes(t));
  }, [rows, q]);

  const patch = (id: string, p: Partial<SwapValue>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const deductions = [
    ["Minor screen scratches", `× ${CONDITION_MULTIPLIERS.minor}`],
    ["Dents on body", `× ${CONDITION_MULTIPLIERS.dents}`],
    ["Cracked screen", `−${DEDUCTIONS.cracked * 100}% of base`],
    ["Battery 80–89%", `−${DEDUCTIONS.battery80 * 100}% of base`],
    ["Battery below 80%", `−${DEDUCTIONS.batteryBelow * 100}% of base`],
    ["Face ID / fingerprint broken", `−${DEDUCTIONS.biometricsBroken * 100}% of base`],
    ["Repaired before", `−${DEDUCTIONS.repaired * 100}% of base`],
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-[640px] text-[15px] text-muted">Base value is what you&rsquo;d pay for a clean, Grade A unit. The estimator adjusts it using the condition answers below.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models" className="input max-w-[360px] bg-bg" type="search" aria-label="Search models" />
      <AdminCard className="overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_44px_44px] gap-3 border-b border-border px-[18px] py-3 text-[13px] font-semibold text-muted">
          <span>Model</span>
          <span>Base value (₦)</span>
          <span>On</span>
          <span />
        </div>
        {list.map((r) => (
          <div key={r.id} className={cn("grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_44px_44px] items-center gap-3 border-b border-border px-[18px] py-2", !r.is_active && "opacity-55")}>
            <span className="text-[15px]">
              <span className="text-muted">{r.brand}</span> {r.model} <span className="num text-small text-muted">{r.storage}</span>
            </span>
            <ValueInput row={r} onSaved={(n) => patch(r.id, { base_value: n })} />
            <Switch
              checked={r.is_active}
              label={`${r.model} ${r.storage} active`}
              onChange={(on) => {
                patch(r.id, { is_active: on });
                start(async () => {
                  if (!report(await saveSwapValue({ ...r, is_active: on }), on ? "Shown in estimator" : "Hidden from estimator")) patch(r.id, { is_active: !on });
                });
              }}
            />
            <button
              type="button"
              aria-label={`Delete ${r.model} ${r.storage}`}
              onClick={() =>
                confirm(`Delete ${r.model} ${r.storage}?`) &&
                start(async () => {
                  if (report(await deleteSwapValue(r.id), "Deleted")) setRows((rs) => rs.filter((x) => x.id !== r.id));
                })
              }
              className="icon-btn text-muted"
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const row = { ...draft, base_value: Number(draft.base_value.replace(/[^\d]/g, "")), is_active: true };
            start(async () => {
              const r = await saveSwapValue(row);
              if (report(r, "Model added") && r.ok && r.id) {
                setRows((rs) => [...rs, { ...row, id: r.id! }]);
                setDraft({ ...draft, model: "", base_value: "" });
              }
            });
          }}
          className="grid grid-cols-2 items-end gap-3 bg-surface px-[18px] py-4 sm:grid-cols-[1fr_1.4fr_1fr_1fr_auto]"
        >
          <label className="field">
            Brand
            <input className="input bg-bg" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} required />
          </label>
          <label className="field">
            Model
            <input className="input bg-bg" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} placeholder="iPhone 15 Pro" required />
          </label>
          <label className="field">
            Storage
            <input className="input bg-bg font-mono" value={draft.storage} onChange={(e) => setDraft({ ...draft, storage: e.target.value })} required />
          </label>
          <label className="field">
            Base value
            <input className="input bg-bg font-mono" inputMode="numeric" value={draft.base_value} onChange={(e) => setDraft({ ...draft, base_value: e.target.value })} required />
          </label>
          <button type="submit" disabled={pending} className="btn btn-primary col-span-2 sm:col-span-1">
            <Plus size={16} strokeWidth={1.75} />
            Add
          </button>
        </form>
      </AdminCard>
      <AdminCard className="flex max-w-[640px] flex-col gap-3.5 p-5">
        <h2 className="text-body font-semibold">How answers change the estimate</h2>
        {deductions.map(([label, v]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-[15px]">
            <span>{label}</span>
            <span className="num text-muted">{v}</span>
          </div>
        ))}
        <p className="text-[13px] text-muted">Customers see a range of ±5%, rounded to the nearest ₦5,000.</p>
      </AdminCard>
    </div>
  );
}
