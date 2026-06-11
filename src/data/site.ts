const fallbackSiteUrl = "https://preview.vittoriozaccaria.net";
const configuredSiteUrl = (
  import.meta.env.SITE ?? import.meta.env.SITE_URL ?? fallbackSiteUrl
).replace(/\/+$/, "");

export const siteMetadata = {
  title: "Vittorio Zaccaria",
  shortName: "VZ",
  description:
    "Academic profile, research, teaching, theses, and writing by Vittorio Zaccaria.",
  url: configuredSiteUrl,
  locale: "en",
  image: "static/images/avatar.jpg"
} as const;

const basePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const withBasePath = (href: string): string => {
  if (/^[a-z]+:/i.test(href) || href.startsWith("//") || href.startsWith("#")) {
    return href;
  }
  if (href === "/") return basePath;
  return `${basePath}${href.replace(/^\//, "")}`;
};

export const absoluteUrl = (href: string): string => {
  if (/^[a-z]+:/i.test(href) || href.startsWith("//")) return href;
  return new URL(withBasePath(href), `${siteMetadata.url}/`).toString();
};
