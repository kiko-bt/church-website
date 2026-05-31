export const routes = {
  home: "/",
  about: "/about",
  bible: "/bible",
  books: "/books",
  sermons: "/sermons",
  gallery: "/gallery",
  contact: "/contact",
  privacy: "/privacy",
} as const;

export type RouteKey = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteKey];
