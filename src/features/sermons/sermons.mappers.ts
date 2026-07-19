import type { Sermon, SermonDocument } from "./sermons.types";

// Maps a raw Sanity sermon document to the clean domain model.
export function mapSermon(doc: SermonDocument): Sermon {
  return {
    id: doc._id,
    slug: doc.slug.current,
    title: doc.title,
    preacher: doc.preacher,
    date: doc.date,
    description: doc.description,
    audioUrl: doc.audioUrl,
    videoUrl: doc.videoUrl,
    bibleReferences: doc.bibleReferences ?? [],
    featured: doc.featured ?? false,
  };
}

export function mapSermons(docs: readonly SermonDocument[]): readonly Sermon[] {
  return docs.map(mapSermon);
}
