import { roundTo } from "./format";

/** Build Brief §5.6 — estimate = base_value × condition multiplier − deductions. */

export type ScreenAns = "perfect" | "minor" | "cracked";
export type BodyAns = "clean" | "dents";
export type BatteryAns = "90" | "80" | "below";
export type YesNo = "yes" | "no";

export interface SwapAnswers {
  screen?: ScreenAns;
  body?: BodyAns;
  battery?: BatteryAns;
  biometrics?: YesNo; // Face ID / fingerprint working
  repaired?: YesNo; // any repairs before
}

export interface SwapQuestion {
  key: keyof SwapAnswers;
  title: string;
  icon: "screen" | "body" | "battery" | "biometrics" | "repaired";
  options: { value: string; label: string; good?: boolean }[];
}

export const SWAP_QUESTIONS: SwapQuestion[] = [
  {
    key: "screen",
    title: "Screen",
    icon: "screen",
    options: [
      { value: "perfect", label: "Perfect", good: true },
      { value: "minor", label: "Minor scratches" },
      { value: "cracked", label: "Cracked" },
    ],
  },
  {
    key: "body",
    title: "Body and frame",
    icon: "body",
    options: [
      { value: "clean", label: "Clean", good: true },
      { value: "dents", label: "Dents or cracks" },
    ],
  },
  {
    key: "battery",
    title: "Battery health",
    icon: "battery",
    options: [
      { value: "90", label: "90% or more", good: true },
      { value: "80", label: "80–89%" },
      { value: "below", label: "Below 80%" },
    ],
  },
  {
    key: "biometrics",
    title: "Face ID or fingerprint working?",
    icon: "biometrics",
    options: [
      { value: "yes", label: "Yes, working", good: true },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "repaired",
    title: "Any repairs before?",
    icon: "repaired",
    options: [
      { value: "no", label: "Never repaired", good: true },
      { value: "yes", label: "Yes, it's been repaired" },
    ],
  },
];

export const CONDITION_MULTIPLIERS = { perfect: 1.0, minor: 0.9, dents: 0.85 } as const;

export const DEDUCTIONS = {
  cracked: 0.25,
  battery80: 0.05,
  batteryBelow: 0.12,
  biometricsBroken: 0.2,
  repaired: 0.07,
} as const;

export function conditionMultiplier(a: SwapAnswers): number {
  let m = 1;
  if (a.screen === "minor") m *= CONDITION_MULTIPLIERS.minor;
  if (a.body === "dents") m *= CONDITION_MULTIPLIERS.dents;
  return m;
}

export function deductionRate(a: SwapAnswers): number {
  let d = 0;
  if (a.screen === "cracked") d += DEDUCTIONS.cracked;
  if (a.battery === "80") d += DEDUCTIONS.battery80;
  if (a.battery === "below") d += DEDUCTIONS.batteryBelow;
  if (a.biometrics === "no") d += DEDUCTIONS.biometricsBroken;
  if (a.repaired === "yes") d += DEDUCTIONS.repaired;
  return d;
}

export interface SwapEstimate {
  estimate: number; // rounded to ₦5,000
  low: number;
  high: number;
}

export function estimateSwap(baseValue: number, a: SwapAnswers): SwapEstimate {
  const raw = Math.max(0, baseValue * conditionMultiplier(a) - baseValue * deductionRate(a));
  return {
    estimate: roundTo(raw, 5000),
    low: roundTo(raw * 0.95, 5000),
    high: roundTo(raw * 1.05, 5000),
  };
}

/** Positive = customer tops up; negative = we pay the customer. */
export function topUp(targetPrice: number, estimate: number): number {
  return targetPrice - estimate;
}

export function answerLabel(key: keyof SwapAnswers, value: string | undefined): string {
  const q = SWAP_QUESTIONS.find((x) => x.key === key);
  return q?.options.find((o) => o.value === value)?.label ?? "—";
}

export interface BreakdownLine {
  label: string;
  amount: number; // negative = deduction
}

/** Line-by-line explanation of the estimate (shown to the customer for transparency). */
export function estimateBreakdown(baseValue: number, a: SwapAnswers): BreakdownLine[] {
  const lines: BreakdownLine[] = [{ label: "Clean, Grade A value", amount: baseValue }];
  let m = 1;
  if (a.screen === "minor") {
    lines.push({ label: "Minor screen scratches", amount: -baseValue * (1 - CONDITION_MULTIPLIERS.minor) });
    m *= CONDITION_MULTIPLIERS.minor;
  }
  if (a.body === "dents") lines.push({ label: "Dents or cracks on body", amount: -baseValue * m * (1 - CONDITION_MULTIPLIERS.dents) });
  if (a.screen === "cracked") lines.push({ label: "Cracked screen", amount: -baseValue * DEDUCTIONS.cracked });
  if (a.battery === "80") lines.push({ label: "Battery 80–89%", amount: -baseValue * DEDUCTIONS.battery80 });
  if (a.battery === "below") lines.push({ label: "Battery below 80%", amount: -baseValue * DEDUCTIONS.batteryBelow });
  if (a.biometrics === "no") lines.push({ label: "Face ID / fingerprint not working", amount: -baseValue * DEDUCTIONS.biometricsBroken });
  if (a.repaired === "yes") lines.push({ label: "Repaired before", amount: -baseValue * DEDUCTIONS.repaired });
  return lines;
}

export const SWAP_STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];
