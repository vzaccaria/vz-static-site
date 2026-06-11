import type { CollectionEntry } from "astro:content";
import { withBasePath } from "./site";

export type BlogPost = CollectionEntry<"blog">;

export const displayTag = (tag: string) => tag.replace(/^topics\//, "");

export const tagSlug = (tag: string) =>
  displayTag(tag)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const tagPath = (tag: string) => `/tags/${tagSlug(tag)}/`;

export const tagHref = (tag: string) => withBasePath(tagPath(tag));

export const postPath = (post: BlogPost) => `/blog/${post.id}/`;

export const postHref = (post: BlogPost) => withBasePath(postPath(post));

export const sortBlogPosts = (posts: BlogPost[]) =>
  [...posts].sort(
    (left, right) =>
      new Date(right.data.date).getTime() - new Date(left.data.date).getTime()
  );

export const collectTagPosts = (posts: BlogPost[]) => {
  const tagPosts = new Map<string, BlogPost[]>();

  for (const post of posts) {
    for (const rawTag of post.data.tags) {
      const display = displayTag(rawTag);
      const current = tagPosts.get(display) ?? [];
      current.push(post);
      tagPosts.set(display, current);
    }
  }

  return tagPosts;
};

export const sortTags = <Value>(tags: Iterable<[string, Value]>) =>
  [...tags].sort(([left], [right]) => left.localeCompare(right));
