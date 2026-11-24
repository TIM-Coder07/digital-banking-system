import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export function isDuplicateKey(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000;
}

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ success: false, message: err.message, code: err.code }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: err.issues[0]?.message ?? "Validation failed", errors: err.flatten().fieldErrors },
      { status: 400 }
    );
  }
  if (isDuplicateKey(err)) {
    return NextResponse.json({ success: false, message: "Duplicate record" }, { status: 409 });
  }
  console.error("[api]", err);
  return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
}
