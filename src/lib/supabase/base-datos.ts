import type { Cliente, DatosCliente } from "@/lib/tipos";

/**
 * Esquema de la base de datos para tipar el cliente de Supabase (D2).
 * Se escribe a mano porque no hay acceso para generarlo con la CLI; tiene que
 * coincidir con las migraciones de supabase/migrations/.
 */
export type BaseDatos = {
  public: {
    Tables: {
      clientes: {
        Row: Cliente;
        Insert: DatosCliente & {
          id?: string;
          owner_id?: string;
          created_at?: string;
        };
        Update: Partial<Cliente>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
