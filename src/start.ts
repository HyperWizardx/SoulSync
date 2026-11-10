import { createStart } from '@tanstack/react-start';
import { attachSupabaseAuth } from '@/integrations/supabase/auth-attacher';
import { rejectFailedResponses } from '@/service/middleware/rejectFailedResponses';

// Orden: primero se adjunta el token; luego, cualquier respuesta de error cruda se vuelve un error.
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, rejectFailedResponses],
}));
