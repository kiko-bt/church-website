import { defineConfig, type PluginOptions } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes, SINGLETON_TYPES } from "./schemas";
import { structure } from "./structure";

// Singleton `_type`s that must exist as exactly one document.
const singletonTypes = new Set<string>(SINGLETON_TYPES);

// Document actions allowed for singletons (no create/delete/duplicate — they
// must remain exactly one document).
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export interface StudioConfigOptions {
  /** Workspace name (must be unique per config that runs). */
  name: string;
  /** Human-facing Studio title. */
  title: string;
  projectId: string;
  dataset: string;
  /** Extra plugins appended after the shared ones (e.g. visionTool). */
  plugins?: PluginOptions[];
}

/**
 * Single source of truth for the Studio configuration.
 *
 * Both the Next.js-side config (`sanity/sanity.config.ts`) and the standalone
 * Studio (`studio-church-ehb/sanity.config.ts`) build their config from here,
 * so the schema, custom desk structure, and singleton rules are defined exactly
 * once and can never drift apart.
 */
export function defineStudioConfig({
  name,
  title,
  projectId,
  dataset,
  plugins = [],
}: StudioConfigOptions) {
  return defineConfig({
    name,
    title,
    projectId,
    dataset,
    plugins: [structureTool({ structure }), ...plugins],
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
}
