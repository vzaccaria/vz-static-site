import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const site = process.env.SITE_URL ?? "https://www.vittoriozaccaria.net";
const base = process.env.SITE_BASE ?? "/";
const basePath = base.endsWith("/") ? base : `${base}/`;

const withConfiguredBase = (href) =>
  `${basePath}${href.replace(/^\//, "")}`;

const rewriteImportedBlogImageUrl = (url) => {
  if (url.startsWith("images/")) return withConfiguredBase(`/static/blog/${url}`);
  if (url.startsWith("./images/")) {
    return withConfiguredBase(`/static/blog/${url.replace(/^\.\//, "")}`);
  }

  return url;
};

const rewriteMarkdownImages = (node) => {
  if (!node || typeof node !== "object") return;

  if (node.type === "image" && typeof node.url === "string") {
    node.url = rewriteImportedBlogImageUrl(node.url);
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach(rewriteMarkdownImages);
    } else {
      rewriteMarkdownImages(value);
    }
  }
};

const remarkStaticBlogImages = () => (tree) => {
  rewriteMarkdownImages(tree);
};

export default defineConfig({
  site,
  base,
  output: "static",
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkStaticBlogImages],
      rehypePlugins: [rehypeKatex]
    })
  }
});
