"use client";
import { useState, useTransition } from "react";
import { saveSettings } from "@/lib/admin/actions";
import type { Settings } from "@/lib/types";
import { displayPhone } from "@/lib/whatsapp";
import { AdminCard, useReport } from "./admin-ui";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [s, setS] = useState({ ...settings, whatsapp_number: displayPhone(settings.whatsapp_number) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const report = useReport();

  const groups: { title: string; fields: { key: keyof Settings; label: string; hint?: string; mono?: boolean; area?: boolean }[] }[] = [
    {
      title: "WhatsApp and social",
      fields: [
        { key: "whatsapp_number", label: "WhatsApp number", hint: "Every order, swap and repair message goes to this number.", mono: true },
        { key: "instagram_handle", label: "Instagram handle" },
      ],
    },
    {
      title: "Store",
      fields: [
        { key: "store_address", label: "Address" },
        { key: "opening_hours", label: "Opening hours" },
        { key: "delivery_note", label: "Delivery note", hint: "Shown at checkout and on the About page.", area: true },
      ],
    },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSettings(s);
          setErrors(r.ok ? {} : (r.fieldErrors ?? {}));
          report(r, "Settings saved");
        });
      }}
    >
      <AdminCard className="flex max-w-[640px] flex-col gap-7 p-5 md:p-6">
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-3.5">
            <h2 className="text-body font-semibold">{g.title}</h2>
            {g.fields.map((f) => (
              <label key={f.key} className="field">
                {f.label}
                {f.area ? (
                  <textarea className="input h-auto min-h-[80px] py-2.5" rows={3} value={s[f.key]} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} />
                ) : (
                  <input className={f.mono ? "input font-mono" : "input"} value={s[f.key]} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} inputMode={f.mono ? "tel" : undefined} />
                )}
                {errors[f.key] ? <span className="text-[13px] text-deal">{errors[f.key]}</span> : f.hint && <span className="text-micro">{f.hint}</span>}
              </label>
            ))}
          </section>
        ))}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </AdminCard>
    </form>
  );
}
