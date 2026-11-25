import { defineConfig, devices } from "@playwright/test";

/**
 * Prueba de punta a punta (Playwright). Se lanza con `npm run e2e` contra
 * E2E_BASE_URL. No forma parte de `npm run check` ni de la CI: necesita un
 * usuario real (E2E_EMAIL y E2E_PASSWORD).
 *
 * Los dos proyectos usan el mismo usuario y comparan las cifras del panel antes
 * y después, así que se ejecutan de uno en uno (workers: 1).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Sin traza: guardaría la contraseña escrita en el login.
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "movil",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
