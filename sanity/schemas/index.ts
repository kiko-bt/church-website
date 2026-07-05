import type { SchemaTypeDefinition } from "sanity";

// Objects
import { imageWithAlt } from "./objects/imageWithAlt";
import { socialLinks } from "./objects/socialLinks";
import { richText } from "./objects/richText";
import { seo } from "./objects/seo";

// Singletons
import { churchSettings } from "./singletons/churchSettings";
import { homeContent } from "./singletons/homeContent";

// Documents
import { sermon } from "./documents/sermon";
import { book } from "./documents/book";
import { galleryAlbum } from "./documents/galleryAlbum";

// Document `_type`s that must exist as exactly one document (enforced by the
// desk structure and document-action filtering in sanity.config.ts).
export const SINGLETON_TYPES = ["churchSettings", "homeContent"] as const;

export const schemaTypes: SchemaTypeDefinition[] = [
  // objects
  imageWithAlt,
  socialLinks,
  richText,
  seo,
  // singletons
  churchSettings,
  homeContent,
  // documents
  sermon,
  book,
  galleryAlbum,
];
