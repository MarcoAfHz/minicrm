import { expect, type Page } from "@playwright/test";

/** Usuario de prueba. Solo se lee de variables de entorno. */
export const EMAIL = process.env.E2E_EMAIL ?? "";
export const PASSWORD = process.env.E2E_PASSWORD ?? "";
export const HAY_CREDENCIALES = EMAIL !== "" && PASSWORD !== "";
export const SIN_CREDENCIALES =
  "Faltan E2E_EMAIL y E2E_PASSWORD: se salta la prueba que necesita iniciar sesión.";

/** Todo lo que crea la prueba empieza así, para poder borrar los restos. */
export const PREFIJO_CLIENTE = "E2E Cliente ";

const BUSCADOR_CLIENTES = "Buscar por nombre o empresa";

/** Inicia sesión con el usuario de prueba y espera a llegar al panel. */
export async function entrar(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/panel$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Panel" }),
  ).toBeVisible();
}

/**
 * La navegación principal visible. En el DOM hay dos (barra lateral de
 * escritorio y barra inferior del móvil) y solo se ve una.
 */
export function navegacionVisible(page: Page) {
  return page
    .getByRole("navigation", { name: "Principal" })
    .filter({ visible: true });
}

/** Va a una sección pulsando su enlace en la navegación visible. */
export async function irA(
  page: Page,
  seccion: "Panel" | "Clientes" | "Oportunidades",
  ruta: RegExp,
): Promise<void> {
  await navegacionVisible(page)
    .getByRole("link", { name: seccion, exact: true })
    .click();
  await expect(page).toHaveURL(ruta);
  await expect(
    page.getByRole("heading", { level: 1, name: seccion }),
  ).toBeVisible();
}

/** Convierte un importe de pantalla ("12.345,67 €") en céntimos. */
export function eurosACentimos(texto: string): number {
  const limpio = texto.replace(/[^\d,-]/g, "").replace(",", ".");
  const valor = Number(limpio);
  if (limpio === "" || !Number.isFinite(valor)) {
    throw new Error(`No es un importe: «${texto}»`);
  }
  return Math.round(valor * 100);
}

export type GanadoEsteMes = { centimos: number; cantidad: number };

/** Lee la tarjeta «Ganado este mes» del panel. Hay que estar ya en /panel. */
export async function leerGanadoEsteMes(page: Page): Promise<GanadoEsteMes> {
  const termino = page.getByRole("term").filter({ hasText: "Ganado este mes" });
  const valor = termino.locator("xpath=following-sibling::dd[1]");
  const detalle = termino.locator("xpath=following-sibling::dd[2]");
  await expect(valor).toBeVisible();

  const textoDetalle = await detalle.innerText();
  const cantidad = /^\s*([\d.]+)/.exec(textoDetalle)?.[1];
  if (cantidad === undefined) {
    throw new Error(`No se entiende el detalle: «${textoDetalle}»`);
  }
  return {
    centimos: eurosACentimos(await valor.innerText()),
    cantidad: Number(cantidad.replace(/\./g, "")),
  };
}

/** Pulsa «Borrar» en la ficha de un cliente, acepta la confirmación y espera al listado. */
export async function borrarClienteDesdeFicha(page: Page): Promise<void> {
  page.once("dialog", (dialogo) => {
    void dialogo.accept();
  });
  await page.getByRole("button", { name: "Borrar", exact: true }).click();
  await expect(page).toHaveURL(/\/clientes$/);
}

/**
 * Borra los clientes de la prueba que hayan quedado de una ejecución anterior
 * (sus oportunidades se borran en cascada). Solo toca los que empiezan por
 * PREFIJO_CLIENTE.
 */
export async function borrarRestos(page: Page): Promise<void> {
  const busqueda = `/clientes?q=${encodeURIComponent(PREFIJO_CLIENTE.trim())}`;
  const resto = page
    .getByRole("link", { name: new RegExp(`^${PREFIJO_CLIENTE}`) })
    .filter({ visible: true })
    .first();

  // Tope para no quedarse en bucle si algo no se borra.
  for (let intento = 0; intento < 20; intento++) {
    await page.goto(busqueda);
    // El buscador sale cuando el listado ya ha cargado.
    await expect(page.getByLabel(BUSCADOR_CLIENTES)).toBeVisible();
    if ((await resto.count()) === 0) {
      return;
    }
    await resto.click();
    await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]{36}$/);
    await borrarClienteDesdeFicha(page);
  }
  throw new Error("Quedan clientes de la prueba sin borrar.");
}

/** Comprueba que no queda ningún cliente con ese nombre. */
export async function comprobarClienteBorrado(
  page: Page,
  nombre: string,
): Promise<void> {
  await page.goto(`/clientes?q=${encodeURIComponent(nombre)}`);
  await expect(page.getByLabel(BUSCADOR_CLIENTES)).toBeVisible();
  await expect(page.getByText(/Ningún cliente coincide/)).toBeVisible();
}
