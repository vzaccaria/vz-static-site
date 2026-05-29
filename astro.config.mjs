import { defineConfig } from "astro/config";

const site = process.env.SITE_URL ?? "https://preview.vittoriozaccaria.net";

export default defineConfig({
  site,
  output: "static"
});
