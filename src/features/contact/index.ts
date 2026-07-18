// Public API of the Contact feature (server-safe; no Client Component exports).
// The server action lives in `./contact.action` and is imported directly by the
// client form — it is intentionally NOT re-exported here.
export * from "./contact.schema";
export * from "./contact.types";
