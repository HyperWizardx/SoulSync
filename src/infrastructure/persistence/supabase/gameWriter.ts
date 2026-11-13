/**
 * Escritura del estado de juego — capa de Infraestructura (solo servidor).
 *
 * Nivel, XP, monedas, gemas, racha, estadísticas, atributos, inventario, efectos de objetos,
 * logros, misiones cumplidas y el estado del Mundo son "dinero del juego": el navegador NO puede
 * escribirlos (migración 0010 quita esos permisos). Solo las server functions, después de validar
 * con las reglas del Dominio, los guardan con el cliente de servicio.
 *
 * IMPORTANTE: el cliente de servicio salta RLS, así que TODA escritura con él debe filtrar por el
 * userId verificado por requireSupabaseAuth (nunca por un id que venga del navegador).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

let warned = false;

/**
 * Cliente con el que el servidor escribe el estado de juego. Si el entorno no tiene la clave de
 * servicio (por ejemplo, en desarrollo local), usa el cliente del usuario: funciona mientras la
 * base todavía permita esas escrituras y evita que la app se caiga antes de aplicar la 0010.
 */
export async function gameWriter(userDb: Db): Promise<Db> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    void supabaseAdmin.auth; // fuerza la creación: lanza si falta la clave de servicio
    return supabaseAdmin;
  } catch (e) {
    if (!warned) {
      warned = true;
      console.error("[gameWriter] Sin SUPABASE_SERVICE_ROLE_KEY: el progreso se escribe con la sesión del usuario.", e);
    }
    return userDb;
  }
}
