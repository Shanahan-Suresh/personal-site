import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://shanahansuresh.com",
  output: "static",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/writing") && !page.includes("/rss"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
