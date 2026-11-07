// Botón compartido para comandos accesibles del compañero AR.
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function Button({ className, type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />;
});