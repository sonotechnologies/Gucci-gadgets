"use client";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteRepairPrice, saveRepairPrice } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import { REPAIR_ISSUES, type RepairIssue, type RepairPrice } from "@/lib/types";
import { AdminCard, useReport } from "./admin-ui";

function Row({ row, onChange, onDelete }: { row: RepairPrice; onChange: (r: RepairPrice) => void; onDelete: () => void }) {
  const [price, setPrice] = useState(String(row.price_from));
  const [duration, setDuration] = useState(row.duration);
  const [pending, start] = useTransition();
  const report = useReport();
  const save = (next: RepairPrice) =>
    start(async () => {
      if (report(await saveRepairPrice(next), "Repair price saved")) onChange(next);
      else {
        setPrice(String(row.price_from));
        setDuration(row.duration);
      }
    });
  return (
    <div className={cn("grid grid-cols-2 items-center gap-2 border-b border-border px-[18px] py-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_44px] sm:gap-3", pending && "opacity-60")}>
      <span className="col-span-2 text-[15px] sm:col-span-1">
        <span className="text-muted">{row.brand}</span> {row.model}
      </span>
      <span className="text-small">{row.issue}</span>
      <input
        aria-label={`Price for ${row.model} ${row.issue}`}
        className="num h-10 rounded-lg border border-border bg-surface-2 px-2.5 text-[15px]"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        onBlur={() => {
          const n = Number(price.replace(/[^\d]/g, ""));
          if (!price || n === row.price_from) return setPrice(String(row.price_from));
          save({ ...row, price_from: n });
        }}
      />
      <input
        aria-label={`Time for ${row.model} ${row.issue}`}
        className="h-10 rounded-lg border border-border bg-surface-2 px-2.5 text-[15px]"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        onBlur={() => duration.trim() && duration !== row.duration && save({ ...row, duration: duration.trim() })}
      />
      <button type="button" onClick={onDelete} aria-label={`Delete ${row.model} ${row.issue}`} className="icon-btn justify-self-end text-muted">
        <Trash2 size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function RepairsTable({ prices }: { prices: RepairPrice[] }) {
  const [rows, setRows] = useState(prices);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ brand: "Apple", model: "", issue: "Screen" as RepairIssue, price_from: "", duration: "Same day" });
  const [pending, start] = useTransition();
  const report = useReport();

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => !t || `${r.brand} ${r.model} ${r.issue}`.toLowerCase().includes(t));
  }, [rows, q]);

  return (
    <div className="flex flex-col gap-5">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device or repair" className="input max-w-[360px] bg-bg" type="search" aria-label="Search repairs" />
      <AdminCard className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_44px] gap-3 border-b border-border px-[18px] py-3 text-[13px] font-semibold text-muted sm:grid">
          <span>Device</span>
          <span>Repair</span>
          <span>From (₦)</span>
          <span>Time</span>
          <span />
        </div>
        {list.map((r) => (
          <Row
            key={r.id}
            row={r}
            onChange={(n) => setRows((rs) => rs.map((x) => (x.id === n.id ? n : x)))}
            onDelete={() =>
              confirm(`Delete ${r.model} ${r.issue}?`) &&
              start(async () => {
                if (report(await deleteRepairPrice(r.id), "Deleted")) setRows((rs) => rs.filter((x) => x.id !== r.id));
              })
            }
          />
        ))}
        {list.length === 0 && <p className="px-[18px] py-6 text-small text-muted">No repairs match that search.</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const row = { ...draft, price_from: Number(draft.price_from.replace(/[^\d]/g, "")) };
            start(async () => {
              const r = await saveRepairPrice(row);
              if (report(r, "Repair added") && r.ok && r.id) {
                setRows((rs) => [...rs, { ...row, id: r.id! }]);
                setDraft({ ...draft, model: "", price_from: "" });
              }
            });
          }}
          className="grid grid-cols-2 items-end gap-3 bg-surface px-[18px] py-4 md:grid-cols-[1fr_1.3fr_1.2fr_1fr_1fr_auto]"
        >
          <label className="field">
            Brand
            <input className="input bg-bg" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} required />
          </label>
          <label className="field">
            Model
            <input className="input bg-bg" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} placeholder="iPhone 14" required />
          </label>
          <label className="field">
            Repair
            <select className="input bg-bg" value={draft.issue} onChange={(e) => setDraft({ ...draft, issue: e.target.value as RepairIssue })}>
              {REPAIR_ISSUES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className="field">
            From (₦)
            <input className="input bg-bg font-mono" inputMode="numeric" value={draft.price_from} onChange={(e) => setDraft({ ...draft, price_from: e.target.value })} required />
          </label>
          <label className="field">
            Time
            <input className="input bg-bg" value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} required />
          </label>
          <button type="submit" disabled={pending} className="btn btn-primary">
            <Plus size={16} strokeWidth={1.75} />
            Add
          </button>
        </form>
      </AdminCard>
    </div>
  );
}
