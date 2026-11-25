# 07 · Prueba de punta a punta en producción

(Se hizo después de publicar en Vercel, porque se ejecuta contra la dirección pública.)

## Ronda 1
**develop entregó:** Playwright `@playwright/test` 1.65.1 (versión exacta), con `npm run e2e`, `playwright.config.ts` y estos archivos:
- `e2e/sesion.spec.ts`: sin sesión, `/panel` lleva a `/login`.
- `e2e/flujo.spec.ts`: el flujo completo.
- `e2e/ayudas.ts`: login, navegación visible, lectura del panel y limpieza.

Hay dos proyectos: `escritorio` y `movil` (375 × 812, donde se comprueba que la navegación es la barra inferior y que la barra lateral está oculta).

El flujo hace esto:
1. Entra en la app.
2. Lee «Ganado este mes» del panel.
3. Crea `E2E Cliente <timestamp>`.
4. Le crea una oportunidad de 12.345,67 €.
5. La mueve a «Ganada» en el tablero.
6. Comprueba que el panel sube **exactamente** 1.234.567 céntimos y una oportunidad. Compara el antes y el después, así que no depende de los datos demo.
7. Borra el cliente.
8. Comprueba que el panel vuelve al valor inicial, lo que demuestra el borrado en cascada.

Decisiones:
- **Credenciales** solo por `E2E_EMAIL` y `E2E_PASSWORD`. Si faltan, el flujo se salta con un mensaje y la prueba de sesión se ejecuta igual.
- **Limpieza** antes y después de cada prueba: borra los restos «E2E Cliente », por si una ejecución falla a mitad. Los datos de la demo quedan intactos.
- **`trace: "off"`**, porque la traza guardaría la contraseña escrita en el login. Los artefactos están en `.gitignore`.
- **`workers: 1`**, porque escritorio y móvil comparten usuario y comparan cifras.
- **Selectores accesibles.** La navegación y «Salir» están duplicados en el DOM (barra lateral y barra móvil), así que se usan `getByRole("navigation", { name: "Principal" }).filter({ visible: true })`. En los campos se usa `getByRole("textbox", { name, exact })`, porque `getByLabel("Nombre")` también encontraba el buscador «Buscar por nombre o empresa».
- **Fuera de `npm run check` y de la CI**, porque necesita credenciales.

Contra `https://minicrm-lovat.vercel.app` pasaron 4 de 4, en 43 segundos.

**testing:** volvió a ejecutar `npm run check`, la e2e contra producción (4 de 4) y la e2e sin credenciales (2 saltadas y 2 pasadas). Hizo grep de credenciales y de `any`/`console.` y revisó `git status --ignored` → `VEREDICTO: APROBADO`.

Avisos, que no bloquean:
- El reporter `list` no muestra el motivo de las pruebas saltadas. Está en el informe HTML y en el README.
- Si otra persona usa la demo mientras corre la prueba, o la prueba cruza el cambio de mes, la comparación exacta podría fallar sin que la app tenga un error.

**Lección:** los tests unitarios comprueban la lógica y la CI el código, pero ninguno de los dos prueba la app publicada con su base de datos real. Esta prueba sí: entra en producción como un usuario y deja todo como estaba.
