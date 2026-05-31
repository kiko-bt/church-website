import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "home", path: "" },
  { key: "about", path: "/about" },
  { key: "bible", path: "/bible" },
  { key: "books", path: "/books" },
  { key: "sermons", path: "/sermons" },
  { key: "gallery", path: "/gallery" },
  { key: "contact", path: "/contact" },
] as const;
