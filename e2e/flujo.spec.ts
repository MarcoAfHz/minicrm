import { expect, test } from "@playwright/test";
import {
  HAY_CREDENCIALES,
  PREFIJO_CLIENTE,
  SIN_CREDENCIALES,
  borrarClienteDesdeFicha,
  borrarRestos,
  comprobarClienteBorrado,
  entrar,
  irA,
  leerGanadoEsteMes,
  navegacionVisible,
} from "./ayudas";

/** Importe de la oportunidad de prueba: lo que se escribe y lo que se espera ver. */
const IMPORTE_ESCRITO = "12.345,67";
const IMPORTE_EN_PANTALLA = /12\.345,67\s€/;
const IMPORTE_CENTIMOS = 1_234_567;

test.describe("flujo completo: cliente, oportunidad ganada y panel", () => {
  test.skip(!HAY_CREDENCIALES, SIN_CREDENCIALES);

  test.beforeEach(async ({ page }) => {
    await entrar(page);
    // Restos de una ejecución anterior que fallase a mitad.
    await borrarRestos(page);
  });

  test.afterEach(async ({ page }) => {
    // Red de seguridad: si la prueba ha fallado, no deja datos en la demo.
    await borrarRestos(page);
  });

  test("crear, ganar, ver en el panel y borrar", async ({ page }, testInfo) => {
    const marca = `${Date.now()}`;
    const nombre = `${PREFIJO_CLIENTE}${marca}`;
    const titulo = `E2E Oportunidad ${marca}`;

    await test.step("la navegación es la de este tamaño de pantalla", async () => {
      const nav = navegacionVisible(page);
      await expect(nav).toHaveCount(1);
      if (testInfo.project.name === "movil") {
        // Barra fija abajo, sin barra lateral.
        const caja = await nav.boundingBox();
        const ventana = page.viewportSize();
        expect(caja).not.toBeNull();
        expect(ventana).not.toBeNull();
        if (caja && ventana) {
          expect(caja.y + caja.height).toBeCloseTo(ventana.height, 0);
          expect(caja.width).toBeCloseTo(ventana.width, 0);
        }
        await expect(page.getByRole("complementary")).toBeHidden();
      } else {
        await expect(page.getByRole("complementary")).toBeVisible();
      }
    });

    const antes = await test.step("leer «Ganado este mes» antes", async () => {
      await irA(page, "Panel", /\/panel$/);
      return leerGanadoEsteMes(page);
    });

    await test.step("crear el cliente", async () => {
      await irA(page, "Clientes", /\/clientes$/);
      await page.getByRole("link", { name: "Nuevo cliente" }).first().click();
      await expect(page).toHaveURL(/\/clientes\/nuevo$/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Nuevo cliente" }),
      ).toBeVisible();
      // Por rol y nombre accesible: el «*» de los obligatorios es aria-hidden.
      await page
        .getByRole("textbox", { name: "Nombre", exact: true })
        .fill(nombre);
      await page
        .getByRole("textbox", { name: "Empresa" })
        .fill("Prueba de punta a punta");
      await page.getByRole("button", { name: "Crear cliente" }).click();

      await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]{36}$/);
      await expect(
        page.getByRole("heading", { level: 1, name: nombre }),
      ).toBeVisible();
      await expect(
        page.getByText("Este cliente aún no tiene oportunidades."),
      ).toBeVisible();
    });

    const urlFicha = page.url();

    await test.step("crear una oportunidad para el cliente", async () => {
      await page.getByRole("link", { name: "Nueva oportunidad" }).click();
      await expect(page).toHaveURL(/\/oportunidades\/nueva\?cliente=/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Nueva oportunidad" }),
      ).toBeVisible();
      // Viene de la ficha: el cliente ya está elegido.
      await expect(
        page.getByRole("combobox", { name: "Cliente", exact: true }),
      ).toHaveValue(urlFicha.split("/").at(-1) ?? "");
      await page
        .getByRole("textbox", { name: "Título", exact: true })
        .fill(titulo);
      await page
        .getByRole("textbox", { name: "Importe (€)" })
        .fill(IMPORTE_ESCRITO);
      await expect(
        page.getByRole("combobox", { name: "Etapa", exact: true }),
      ).toHaveValue("nuevo");
      await page.getByRole("button", { name: "Crear oportunidad" }).click();

      // Vuelve a la ficha del cliente, con la oportunidad en la lista.
      await expect(page).toHaveURL(urlFicha);
      const lista = page.getByRole("region", { name: "Oportunidades" });
      await expect(
        lista.getByRole("link", { name: `Editar ${titulo}` }),
      ).toBeVisible();
      await expect(lista.getByText(IMPORTE_EN_PANTALLA).first()).toBeVisible();
    });

    await test.step("moverla a «Ganada» en el tablero", async () => {
      await irA(page, "Oportunidades", /\/oportunidades$/);
      const enlace = page.getByRole("link", { name: `Editar ${titulo}` });
      await expect(
        page.getByRole("region", { name: /^Nuevo/ }).getByRole("link", {
          name: `Editar ${titulo}`,
        }),
      ).toBeVisible();

      const tarjeta = page.getByRole("article").filter({ has: enlace });
      await tarjeta
        .getByLabel(`Mover «${titulo}» a otra etapa`)
        .selectOption({ label: "Ganada" });
      await tarjeta.getByRole("button", { name: "Mover" }).click();

      await expect(
        page.getByRole("region", { name: /^Ganada/ }).getByRole("link", {
          name: `Editar ${titulo}`,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: /^Nuevo/ }).getByRole("link", {
          name: `Editar ${titulo}`,
        }),
      ).toHaveCount(0);
    });

    await test.step("el panel suma la venta a «Ganado este mes»", async () => {
      await irA(page, "Panel", /\/panel$/);
      const despues = await leerGanadoEsteMes(page);
      expect(despues.centimos - antes.centimos).toBe(IMPORTE_CENTIMOS);
      expect(despues.cantidad - antes.cantidad).toBe(1);
    });

    await test.step("borrar el cliente (y su oportunidad)", async () => {
      await page.goto(urlFicha);
      await expect(
        page.getByRole("heading", { level: 1, name: nombre }),
      ).toBeVisible();
      await borrarClienteDesdeFicha(page);
      await comprobarClienteBorrado(page, nombre);

      // La oportunidad se ha borrado en cascada: el panel vuelve a lo de antes.
      await page.goto("/panel");
      expect(await leerGanadoEsteMes(page)).toEqual(antes);
    });
  });
});
