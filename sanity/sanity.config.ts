import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes, SINGLETON_TYPES } from "./schemas";
import { structure } from "./structure";

const singletonTypes = new Set<string>(SINGLETON_TYPES);

// Document actions allowed for singletons (no create/delete/duplicate — they
// must remain exactly one document).
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "church-website-bitola",
  title: "Црква Евангелие Христово - Битола",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    // Hide singletons from the global "create new document" menu.
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    // Restrict singleton documents to safe, non-duplicating actions.
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(
            ({ action }) => action !== undefined && singletonActions.has(action)
          )
        : input,
  },
});
