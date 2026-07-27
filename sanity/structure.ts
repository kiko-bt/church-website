import type { StructureResolver } from "sanity/structure";

// Desk structure. Pins the two singletons to single, fixed documents (no list,
// no create/delete) and lists the collection document types normally.
//
// The `documentId(...)` calls below are what guarantee the singleton always has
// the well-known id the site queries by (`*[_id == "churchSettings"][0]`,
// `*[_id == "homeContent"][0]`). Combined with the action/template filtering in
// defineStudioConfig.ts, an editor cannot create a second one or land the
// content on a random id.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Church Settings")
        .id("churchSettings")
        .child(
          S.document()
            .schemaType("churchSettings")
            .documentId("churchSettings")
            .title("Church Settings")
        ),
      S.listItem()
        .title("Home Page")
        .id("homeContent")
        .child(
          S.document()
            .schemaType("homeContent")
            .documentId("homeContent")
            .title("Home Page")
        ),
      S.divider(),
      S.documentTypeListItem("sermon").title("Sermons"),
      S.documentTypeListItem("book").title("Books"),
      S.documentTypeListItem("galleryAlbum").title("Gallery Albums"),
    ]);
