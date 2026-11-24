import { CURRENCY } from "./constants";

/** Amounts are stored as integer paisa. 12345 => BDT 123.45 */
export function formatMoney(paisa: number, opts: { code?: boolean } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: opts.code ? "code" : "narrowSymbol",
    minimumFractionDigits: 2,
  }).format((paisa ?? 0) / 100);
}

export function formatCompactMoney(paisa: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format((paisa ?? 0) / 100);
}

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

export const formatDay = (d: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(d));

export const formatMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
};

export const maskAccount = (n: string) => `•••• ${n.slice(-4)}`;

export const groupAccount = (n: string) => n.replace(/(\d{4})(?=\d)/g, "$1 ");
