let memoryHash = "";
const eventName = "clausepilot-pending-transaction";
const key = () =>
  `clausepilot:pending:${process.env.NEXT_PUBLIC_NETWORK || "studionet"}:${(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "").toLowerCase()}`;
export const validHash = (value: string) => /^0x[0-9a-fA-F]{64}$/.test(value);
export function pendingHash(): string {
  if (typeof window === "undefined") return "";
  try {
    const saved = window.localStorage.getItem(key()) || "";
    return validHash(saved) ? saved : memoryHash;
  } catch {
    return memoryHash;
  }
}
export function storePending(hash: string): void {
  if (!validHash(hash)) throw new Error("Invalid transaction hash.");
  memoryHash = hash;
  try {
    window.localStorage.setItem(key(), hash);
  } catch {
    /* Memory guard still protects this tab. */
  }
  window.dispatchEvent(new Event(eventName));
}
export function clearPending(hash: string): void {
  if (pendingHash().toLowerCase() !== hash.toLowerCase()) return;
  memoryHash = "";
  try {
    window.localStorage.removeItem(key());
  } catch {
    /* Storage may be unavailable. */
  }
  window.dispatchEvent(new Event(eventName));
}
export function subscribePending(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key() || event.key === null) {
      memoryHash = event.newValue && validHash(event.newValue) ? event.newValue : '';
      listener();
    }
  };
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", onStorage);
  };
}
