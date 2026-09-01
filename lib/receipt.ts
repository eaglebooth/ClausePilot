type RecordValue = Record<string, unknown>;

function walk(value: unknown, seen = new Set<unknown>()): unknown[] {
  if (value === null || value === undefined || seen.has(value)) return [];
  if (typeof value !== "object") return [value];
  seen.add(value);
  const record = value as RecordValue;
  const preferred = ["readable", "returnValue", "return_value", "result", "data", "calldata", "output"];
  return [...preferred.flatMap((key) => key in record ? walk(record[key], seen) : []), ...Object.values(record).flatMap((item) => walk(item, seen))];
}

export function decodeReturnedId(...sources: unknown[]): string {
  for (const source of sources) {
    for (const candidate of walk(source)) {
      if (typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate >= 0) return String(candidate);
      if (typeof candidate === "bigint" && candidate >= BigInt(0)) return candidate.toString();
      if (typeof candidate !== "string") continue;
      const clean = candidate.trim().replace(/^"|"$/g, "");
      if (/^\d+$/.test(clean)) return String(BigInt(clean));
      if (/^0x[0-9a-f]+$/i.test(clean)) return BigInt(clean).toString();
      try {
        const parsed = JSON.parse(candidate) as unknown;
        const nested = decodeReturnedId(parsed);
        if (nested) return nested;
      } catch { /* non-JSON */ }
    }
  }
  throw new Error("FINALIZED_RETURN_ID_NOT_FOUND");
}
