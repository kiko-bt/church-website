import type { SanitySlug } from "@/types/sanity";

export type Sermon = {
  readonly _id: string;
  readonly _type: "sermon";
  readonly title: string;
  readonly slug: SanitySlug;
  readonly preacher: string;
  readonly date: string;
  readonly description?: string;
  readonly audioUrl?: string;
  readonly videoUrl?: string;
};
