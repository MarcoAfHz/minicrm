import { z } from "zod";

export const esquemaLogin = z.object({
  email: z
    .string({ error: "Introduce tu email." })
    .trim()
    .min(1, { error: "Introduce tu email." })
    .pipe(z.email({ error: "Introduce un email válido." })),
  password: z
    .string({ error: "Introduce tu contraseña." })
    .min(1, { error: "Introduce tu contraseña." }),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;
