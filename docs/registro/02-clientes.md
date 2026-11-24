# 02 · Clientes

## Ronda 1
**develop entregó:**
- La migración `clientes`, con RLS, 4 políticas para `authenticated`, checks de longitud e índice por `owner_id`.
- El listado con buscador en el servidor (`ilike`, con `%`, `_` y `\` escapados) y dos estados vacíos.
- El alta y la edición con Zod y errores por campo.
- El borrado con confirmación.
- La ficha, con `notFound()` si el cliente no es del usuario.
- 43 tests nuevos (70 en total).

Una decisión documentada: PostgREST trata `*` como comodín y no se puede escapar, así que `*` se cambia por `_`.

**testing:** `VEREDICTO: APROBADO`. Comprobó que el filtro `.or()` va entre comillas, así que no se pueden inyectar filtros, y que las políticas de update tienen `using` y `with check`. Dejó 2 avisos que el orquestador decidió **no dejar pasar**:
1. **[D3/D4]** Zod contaba la longitud en unidades UTF-16 (`.length`) y PostgreSQL en caracteres (`char_length`). Un nombre de un solo emoji "😀" pasaba Zod (`length` 2) pero lo rechazaba el `check` de la base de datos, y el usuario veía un error genérico en vez del error del campo.
2. **[D3]** Editar y borrar filtraban solo por `id` y dependían únicamente de RLS.

## Ronda 2
**develop:**
1. Zod cuenta caracteres reales (`[...valor].length`) en todos los campos, igual que `char_length`. Tests nuevos con un emoji, 100 y 101 emojis y un acento combinado (e + U+0301 cuenta 2, igual que en PostgreSQL).
2. Segunda defensa: `.eq("owner_id", user.id)` en editar, borrar y `obtenerCliente`, con tests que comprueban la cadena de llamadas.

Ahora hay 78 tests.

**testing:** `VEREDICTO: APROBADO`. Queda un aviso menor: `maxLength` en el navegador sigue contando unidades UTF-16. Es más estricto que el servidor y no rompe nada.

**Lección:** la IA escribe una validación "correcta" en JS que no coincide con cómo cuenta la base de datos. Solo se ve al comparar las dos capas.
