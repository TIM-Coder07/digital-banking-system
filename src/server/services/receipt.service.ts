import { jsPDF } from "jspdf";
import { APP_NAME, label } from "@/lib/constants";
import { moneyText } from "@/server/utils/money";

type ReceiptAccount = { accountNumber?: string; owner?: { name?: string } } | null | undefined;

export type ReceiptData = {
  txnId: string;
  type: string;
  status: string;
  amount: number;
  fee: number;
  description?: string | null;
  createdAt: Date | string;
  fromAccount?: ReceiptAccount;
  toAccount?: ReceiptAccount;
};

const mask = (n?: string) => (n ? `**** **** ${n.slice(-4)}` : "-");

export function buildReceiptPdf(t: ReceiptData): ArrayBuffer {
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 18, 32);
  doc.rect(0, 0, w, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(APP_NAME, 24, 32);
  doc.setFontSize(10);
  doc.text("Transaction Receipt", 24, 50);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(22);
  doc.text(moneyText(t.amount), 24, 110);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${label(t.type)} | ${label(t.status)}`, 24, 128);

  const rows: [string, string][] = [
    ["Reference", t.txnId],
    ["Date", new Date(t.createdAt).toUTCString()],
    ["From", t.fromAccount ? `${t.fromAccount.owner?.name ?? ""} ${mask(t.fromAccount.accountNumber)}`.trim() : "Bank"],
    ["To", t.toAccount ? `${t.toAccount.owner?.name ?? ""} ${mask(t.toAccount.accountNumber)}`.trim() : "Bank"],
    ["Fee", moneyText(t.fee)],
    ["Total debited", moneyText(t.amount + t.fee)],
    ["Description", t.description || "-"],
  ];

  let y = 165;
  for (const [k, v] of rows) {
    doc.setTextColor(120, 120, 120);
    doc.text(k, 24, y);
    doc.setTextColor(20, 20, 20);
    doc.text(doc.splitTextToSize(v, w - 150), 130, y);
    y += 24;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(24, y, w - 24, y);
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Simulated banking project. Not a real financial document.", 24, y + 18);

  return doc.output("arraybuffer");
}
