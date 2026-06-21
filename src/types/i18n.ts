import enMessages from "../../messages/en.json";

/**
 * The deterministic set of translation namespaces used across the site.
 *
 * Each value corresponds to a top-level key in `messages/{mk,en}.json` and is
 * the `namespace` argument passed to next-intl's `getTranslations()` /
 * `useTranslations()`. Reference this type instead of bare string literals so
 * namespaces stay consistent and discoverable.
 *
 * Note: page-level metadata (titles/descriptions) intentionally lives under
 * each page's own namespace (e.g. `about.title`, `about.metaDescription`)
 * rather than a dedicated `metadata` namespace — there are no shared metadata
 * strings yet, so a separate namespace would only add empty keys.
 */
export type TranslationNamespace =
  | "navigation"
  | "theme"
  | "locale"
  | "common"
  | "home"
  | "about"
  | "bible"
  | "sermons"
  | "books"
  | "gallery"
  | "contact"
  | "privacy"
  | "footer";

// The actual top-level namespaces declared in the message dictionary.
type MessageNamespace = keyof typeof enMessages;

// Compile-time guard: `TranslationNamespace` and the message file must describe
// exactly the same namespaces. If either side drifts (a namespace added,
// removed, or renamed without updating the other), `Equals` resolves to
// `false` and `Expect<false>` fails the `extends true` constraint, breaking
// `tsc` / the build. Purely type-level — no runtime output. Exported so it
// counts as used (it is intentionally not re-exported from the types barrel).
type Expect<T extends true> = T;
type Equals<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2
    ? true
    : false;
export type AssertTranslationNamespacesInSync = Expect<
  Equals<TranslationNamespace, MessageNamespace>
>;
