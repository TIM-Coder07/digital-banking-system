import { randomBytes, randomInt } from "crypto";

/** e.g. TXN20261124A1B2C3D4E5 */
export function generateTxnId() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TXN${ymd}${randomBytes(5).toString("hex").toUpperCase()}`;
}

/** 12 digit account number, never starting with 0. */
export function generateAccountNumber() {
  let n = String(randomInt(1, 10));
  for (let i = 0; i < 11; i++) n += String(randomInt(0, 10));
  return n;
}
