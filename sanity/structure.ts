import type { StructureResolver } from "sanity/structure";

// Desk structure. Pins the two singletons to single, fixed documents (no list,
// no create/delete) and lists the collection document types normally. This is
// what makes the `*[_type == "..."][0]` singleton queries safe — an editor
// cannot accidentally create a second churchSettings/homeContent.
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
