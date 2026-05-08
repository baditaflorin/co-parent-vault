import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4317/co-parent-vault/",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run preview -- --port 4317 --strictPort",
    url: "http://127.0.0.1:4317/co-parent-vault/",
    reuseExistingServer: false,
    timeout: 60_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
