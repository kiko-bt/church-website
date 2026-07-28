// Standalone Bible dataset validator.
//
// Reuses the SAME Zod schemas + cross-file rules as the app (bible.schema.ts),
// so there is a single source of validation truth. Wired to `prebuild`, so a
// bad dataset fails `next build` before anything is deployed.
//
// Run with:  npm run bible:validate
//   (node scripts/validate-bible.ts)

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  manifestSchema,
  bookFileSchema,
  searchIndexSchema,
  validateDataset,
  validateSearchIndex,
  type ParsedBookFile,
  type ParsedManifest,
} from "../src/features/bible/bible.schema.ts";
import { BIBLE_CANON } from "../src/features/bible/bible.constants.ts";
import {
  BIBLE_DISPLAY_NAMES,
  assertDisplayNamesComplete,
} from "../src/features/bible/bible.display-names.ts";
import { locales } from "../src/constants/locales.ts";

const DATA_DIR = join(process.cwd(), "src", "data", "bible");

const errors: string[] = [];

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

// --- Manifest ---
const manifestPath = join(DATA_DIR, "manifest.json");
let manifest: ParsedManifest | null = null;
if (!existsSync(manifestPath)) {
  errors.push("manifest.json is missing (run `npm run bible:build`)");
} else {
  const parsed = manifestSchema.safeParse(readJsonSafe(manifestPath));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`manifest.json: ${issue.path.join(".")} — ${issue.message}`);
    }
  } else {
    manifest = parsed.data;
  }
}

// --- Per-locale book files ---
const filesByLocale: Record<string, Record<string, ParsedBookFile>> = {};

// Detect unexpected locale directories (e.g. an accidental "de/" folder).
const presentLocaleDirs = readdirSync(DATA_DIR).filter((entry) =>
  statSync(join(DATA_DIR, entry)).isDirectory()
);
for (const dir of presentLocaleDirs) {
  // "search" is a reserved (built) directory, not a locale.
  if (dir === "search") continue;
  if (!(locales as readonly string[]).includes(dir)) {
    errors.push(`unexpected directory "src/data/bible/${dir}" (not a known locale)`);
  }
}

for (const locale of locales) {
  const localeDir = join(DATA_DIR, locale);
  filesByLocale[locale] = {};
  if (!existsSync(localeDir)) {
    errors.push(`missing locale directory "src/data/bible/${locale}"`);
    continue;
  }
  const files = readdirSync(localeDir).filter((name) => name.endsWith(".json"));
  for (const fileName of files) {
    const bookId = fileName.replace(/\.json$/, "");
    const parsed = bookFileSchema.safeParse(readJsonSafe(join(localeDir, fileName)));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        // Book files carry no display name; a "name" here is almost always
        // someone trying to rename a book in the wrong place, so say where to
        // do it instead of leaving them with Zod's generic wording.
        if (issue.code === "unrecognized_keys" && issue.keys.includes("name")) {
          errors.push(
            `${locale}/${fileName}: remove the "name" field — book names are set in ` +
              `src/features/bible/bible.display-names.ts, not in the book files`
          );
          continue;
        }
        errors.push(`${locale}/${fileName}: ${issue.path.join(".")} — ${issue.message}`);
      }
      continue;
    }
    filesByLocale[locale][bookId] = parsed.data;
  }
}

// --- Display names: the registry must cover the canon exactly ---
errors.push(...assertDisplayNamesComplete(locales, BIBLE_CANON.map((b) => b.id)));

// --- Holistic cross-file validation (only if the manifest parsed) ---
if (manifest) {
  errors.push(
    ...validateDataset({
      canon: BIBLE_CANON,
      manifest,
      filesByLocale,
      expectedLocales: locales,
    })
  );

  // --- Search indexes (data/bible/search/<locale>.json) ---
  for (const locale of locales) {
    const searchPath = join(DATA_DIR, "search", `${locale}.json`);
    if (!existsSync(searchPath)) {
      errors.push(`missing search index "search/${locale}.json"`);
      continue;
    }
    const parsed = searchIndexSchema.safeParse(readJsonSafe(searchPath));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`search/${locale}.json: ${issue.path.join(".")} — ${issue.message}`);
      }
      continue;
    }
    errors.push(
      ...validateSearchIndex(
        manifest,
        parsed.data,
        locale,
        BIBLE_DISPLAY_NAMES[locale] ?? {}
      )
    );
  }
}

// --- Report ---
if (errors.length > 0) {
  console.error(`\n✖ Bible dataset validation failed (${errors.length} error(s)):\n`);
  for (const error of errors) console.error(`  • ${error}`);
  console.error("");
  process.exit(1);
}

console.log("✔ Bible dataset is valid.");

// Parses JSON, converting a malformed-JSON throw into a recorded error so the
// run reports it instead of crashing.
function readJsonSafe(path: string): unknown {
  try {
    return readJson(path);
  } catch (error) {
    errors.push(`${path}: malformed JSON — ${(error as Error).message}`);
    return undefined;
  }
}
