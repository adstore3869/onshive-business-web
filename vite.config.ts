import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: "src",
  publicDir: "../public",
  base: "/",
  plugins: [
    {
      name: "shared-site-layout",
      transformIndexHtml(html) {
        const page = html.match(/data-page="([^"]+)"/)?.[1] ?? "home";
        let header = readFileSync(
          fromRoot("./src/partials/header.html"),
          "utf8",
        );
        if (page !== "home")
          header = header.replace(
            `href="/${page}/"`,
            `href="/${page}/" aria-current="page"`,
          );
        const footer = readFileSync(
          fromRoot("./src/partials/footer.html"),
          "utf8",
        );
        return html
          .replace("<!-- site:header -->", header)
          .replace("<!-- site:footer -->", footer);
      },
    },
  ],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(
        [
          "index.html",
          "about/index.html",
          "business/index.html",
          "history/index.html",
          "careers/index.html",
          "contact/index.html",
          "404.html",
        ].map((path) => [path, fromRoot(`./src/${path}`)]),
      ),
    },
  },
  server: {
    host: "127.0.0.1",
    fs: {
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.leerness/**", "**/tmp/**"],
    },
  },
});
