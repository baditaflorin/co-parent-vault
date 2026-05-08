import { rmSync } from "node:fs";

for (const path of [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/sw.js",
  "docs/icon.svg",
  "docs/manifest.webmanifest"
]) {
  rmSync(path, { recursive: true, force: true });
}
