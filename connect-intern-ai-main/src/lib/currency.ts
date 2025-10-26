// Currency helpers for normalizing stipend display to INR

const DEFAULT_USD_INR = 83; // fallback average rate

function extractNumber(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, "");
  const match = cleaned.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  return parseFloat(match[1]);
}

export function isUSD(value?: string): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v.includes("$") || v.includes("usd");
}

export function isINR(value?: string): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v.includes("₹") || v.includes("inr");
}

export function usdToInr(usdAmount: number): number {
  const rate = Number((import.meta as any).env?.VITE_USD_INR_RATE) || DEFAULT_USD_INR;
  return usdAmount * rate;
}

export function normalizeStipendToINR(stipend?: string): string | undefined {
  if (!stipend) return stipend;
  if (isINR(stipend)) return stipend;
  if (!isUSD(stipend)) return stipend;

  const num = extractNumber(stipend);
  if (num == null || !isFinite(num)) return stipend;

  const inr = Math.round(usdToInr(num) / 100) * 100; // round to nearest hundred
  // Preserve cadence like "/month" if present
  const cadence = stipend.toLowerCase().includes("month") ? "/month" : stipend.toLowerCase().includes("year") ? "/year" : "";
  return `₹${inr.toLocaleString("en-IN")}${cadence}`;
}


