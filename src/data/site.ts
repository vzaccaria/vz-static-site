export const siteMetadata = {
  title: "Vittorio Zaccaria",
  shortName: "VZ",
  description:
    "Academic profile, research, teaching, theses, and writing by Vittorio Zaccaria.",
  url: "https://preview.vittoriozaccaria.net",
  locale: "en"
} as const;

const basePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const withBasePath = (href: string): string => {
  if (/^[a-z]+:/i.test(href) || href.startsWith("#")) return href;
  if (href === "/") return basePath;
  return `${basePath}${href.replace(/^\//, "")}`;
};
