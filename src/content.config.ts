import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import {
  authorFrontmatterSchema,
  blogFrontmatterSchema
} from "./data/content-model";

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./data/imported/blog" }),
  schema: blogFrontmatterSchema
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./data/imported/authors" }),
  schema: authorFrontmatterSchema
});

export const collections = { authors, blog };
