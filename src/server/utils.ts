import { appError } from "./errors";

export function throwInvalidPayload(detail: string): never {
  throw appError({
    status: 502,
    code: "SEC_INVALID_RESPONSE",
    message: `SEC returned invalid data: ${detail}.`,
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateObjectValue(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throwInvalidPayload(label);
  }
  return value;
}

export function validateText(value: unknown, label: string): string {
  if (typeof value !== "string") throwInvalidPayload(label);
  return value;
}

export function isValidDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function normalizeTicker(value: string) {
  const ticker = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.-]{0,29}$/.test(ticker)) {
    throw appError({
      status: 400,
      code: "INVALID_TICKER",
      message: "Enter a valid SEC-listed ticker, such as AAPL or BRK-B.",
    });
  }
  return ticker;
}
