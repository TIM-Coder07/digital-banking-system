/** Convert a validated taka amount to integer paisa. Only the server does this. */
export const toPaisa = (taka: number) => Math.round(taka * 100);

export const fromPaisa = (paisa: number) => paisa / 100;

/** Plain text money for PDFs and CSVs (no currency symbol font needed). */
export const moneyText = (paisa: number) => `BDT ${(paisa / 100).toFixed(2)}`;
