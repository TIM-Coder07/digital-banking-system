export const DEFAULT_LOAN_RATE = 12;

export function calcEmi(principal: number, annualRate: number, months: number) {
  if (!principal || !months) return { emi: 0, total: 0, interest: 0 };
  const r = annualRate / 12 / 100;
  const emi =
    r === 0
      ? Math.ceil(principal / months)
      : Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  const total = emi * months;
  return { emi, total, interest: total - principal };
}