import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const importedBlogImages = path.join(process.cwd(), "data/imported/blog/images");
const publicBlogImages = path.join(process.cwd(), "public/static/blog/images");

if (!existsSync(importedBlogImages)) {
  console.log("No imported blog images found; skipped static asset sync.");
  process.exit(0);
}

rmSync(publicBlogImages, { recursive: true, force: true });
mkdirSync(path.dirname(publicBlogImages), { recursive: true });
cpSync(importedBlogImages, publicBlogImages, { recursive: true, force: true });

console.log("Synced imported blog images to public/static/blog/images.");
