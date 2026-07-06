import { defineStudioConfig } from "./defineStudioConfig";

// Schema, custom desk structure, and singleton rules all live in
// `defineStudioConfig` so they are shared, unchanged, with the standalone
// Studio (studio-church-ehb) — this project stays the single source of truth.
export default defineStudioConfig({
  name: "church-website-bitola",
  title: "Црква Евангелие Христово - Битола",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});
