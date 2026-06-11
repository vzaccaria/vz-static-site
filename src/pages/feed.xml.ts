import { getCollection } from "astro:content";
import { displayTag, postPath, sortBlogPosts } from "../data/blog";
import { absoluteUrl, siteMetadata } from "../data/site";
import { escapeXml, toRssDate } from "../data/xml";

export async function GET() {
  const posts = sortBlogPosts(await getCollection("blog"));
  const feedUrl = absoluteUrl("/feed.xml");
  const siteUrl = absoluteUrl("/");
  const latestDate = posts[0]?.data.date ?? new Date(0);

  const items = posts
    .map((post) => {
      const url = absoluteUrl(postPath(post));
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(displayTag(tag))}</category>`)
        .join("");

      return [
        "<item>",
        `<title>${escapeXml(post.data.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `<pubDate>${escapeXml(toRssDate(post.data.date))}</pubDate>`,
        `<description>${escapeXml(post.data.summary)}</description>`,
        categories,
        "</item>"
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(siteMetadata.title)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(siteMetadata.description)}</description>`,
    `<language>${escapeXml(siteMetadata.locale)}</language>`,
    `<lastBuildDate>${escapeXml(toRssDate(latestDate))}</lastBuildDate>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    "</channel>",
    "</rss>"
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
