export const TESTAMENTS = {
  OT: { mk: "Стар Завет", en: "Old Testament" },
  NT: { mk: "Нов Завет", en: "New Testament" },
} as const;

export type Testament = keyof typeof TESTAMENTS;

export const BIBLE_DATA_PATH = "src/data/bible" as const;
