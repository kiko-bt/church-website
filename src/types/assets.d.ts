// Ambient module declarations for non-code, side-effect asset imports.
//
// Global stylesheets are imported for their side effect only
// (e.g. `import "@/app/globals.css"` in the locale layout). Next.js processes
// these at the bundler level and does not ship a TypeScript declaration for
// them, so under `noUncheckedSideEffectImports` (TS 5.6+) the compiler reports
// TS2307 for the import. Declaring the module here satisfies the type-checker
// without affecting the bundler. Scoped CSS Modules (`*.module.css`) are typed
// separately by Next and are unaffected (the more specific pattern wins).
declare module "*.css";
