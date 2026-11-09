import { randomUUID } from "node:crypto";

/**
 * UUID v4 today; the storage layer is a text primary key, so switching to
 * UUIDv7 (time-ordered) later requires no migration of types.
 */
export function newId(): string {
  return randomUUID();
}
