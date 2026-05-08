import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
) as {
  version: string;
};

function gitCommit(): string {
  if (existsSync(".build-commit")) {
    return readFileSync(".build-commit", "utf8").trim();
  }

  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  base: "/co-parent-vault/",
  plugins: [react()],
  resolve: {
    alias: {
      "./libsodium.mjs": fileURLToPath(
        new URL("./node_modules/libsodium/dist/modules-esm/libsodium.mjs", import.meta.url)
      )
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __COMMIT_SHA__: JSON.stringify(process.env.COMMIT_SHA ?? gitCommit()),
    __REPO_URL__: JSON.stringify("https://github.com/baditaflorin/co-parent-vault"),
    __PAYPAL_URL__: JSON.stringify("https://www.paypal.com/paypalme/florinbadita")
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    target: "esnext",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "@tanstack/react-query"],
          yjs: ["yjs"],
          ical: ["ical.js"]
        }
      }
    }
  }
});
