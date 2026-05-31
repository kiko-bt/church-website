export type NavKey =
  | "home"
  | "about"
  | "bible"
  | "books"
  | "sermons"
  | "gallery"
  | "contact";

export type NavItem = {
  readonly key: NavKey;
  readonly path: string;
};

export type NavGroup = {
  readonly key: string;
  readonly items: readonly NavItem[];
};
