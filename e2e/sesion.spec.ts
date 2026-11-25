import { expect, test } from "@playwright/test";

test("sin sesión, /panel lleva a /login", async ({ page }) => {
  await page.goto("/panel");
  // Con Cache Components la redirección llega como <meta http-equiv="refresh">,
  // que tarda un segundo: se espera a la URL, no a la respuesta.
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
