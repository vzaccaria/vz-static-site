import { getCollection } from "astro:content";
import {
  collectTagPosts,
  postPath,
  sortBlogPosts,
  sortTags,
  tagPath
} from "../data/blog";
import { absoluteUrl } from "../data/site";
import { escapeXml, toSitemapDate } from "../data/xml";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "monthly", priority: "1.0" },
  { path: "/bio/", changefreq: "monthly", priority: "0.8" },
  { path: "/research/", changefreq: "monthly", priority: "0.8" },
  { path: "/courses/", changefreq: "monthly", priority: "0.7" },
  { path: "/theses/", changefreq: "monthly", priority: "0.7" },
  { path: "/blog/", changefreq: "weekly", priority: "0.8" },
  { path: "/tags/", changefreq: "weekly", priority: "0.5" }
];

const renderEntry = (entry: SitemapEntry) =>
  [
    "<url>",
    `<loc>${escapeXml(absoluteUrl(entry.path))}</loc>`,
    entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "",
    entry.changefreq ? `<changefreq>${escapeXml(entry.changefreq)}</changefreq>` : "",
    entry.priority ? `<priority>${escapeXml(entry.priority)}</priority>` : "",
    "</url>"
  ].join("");

export async function GET() {
  const posts = sortBlogPosts(await getCollection("blog"));
  const latestPostDate = toSitemapDate(posts[0]?.data.date ?? new Date(0));
  const tagPosts = collectTagPosts(posts);

  const postEntries = posts.map((post) => ({
    path: postPath(post),
    lastmod: toSitemapDate(post.data.date),
    changefreq: "monthly",
    priority: "0.6"
  }));

  const tagEntries = sortTags(tagPosts.entries()).map(([tag, taggedPosts]) => ({
    path: tagPath(tag),
    lastmod: toSitemapDate(sortBlogPosts(taggedPosts)[0]?.data.date ?? new Date(0)),
    changefreq: "weekly",
    priority: "0.4"
  }));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries.map((entry) => renderEntry({ ...entry, lastmod: latestPostDate })),
    ...postEntries.map(renderEntry),
    ...tagEntries.map(renderEntry),
    "</urlset>"
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
