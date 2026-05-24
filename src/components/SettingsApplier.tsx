import { useEffect } from "react";
import { useUserStore } from "@/hooks/useUserStore";

const TEXT_SIZE_SCALE: Record<string, string> = {
  normal: "16px",
  large: "18px",
  xl: "20px",
};

/** Aplica tema (claro/oscuro) y tamaño de texto al <html> según los settings del usuario. */
export function SettingsApplier() {
  const { user } = useUserStore();
  const { theme, textSize } = user.settings;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "light") root.classList.remove("dark");
    else root.classList.add("dark");
    root.style.fontSize = TEXT_SIZE_SCALE[textSize] ?? "16px";
  }, [theme, textSize]);

  return null;
}
