import { useEffect, useState } from "react";

export type Tema = "auto" | "light" | "dark";
const CHAVE = "doppa_tema";

export function lerTema(): Tema {
  try { const t = localStorage.getItem(CHAVE); return t === "light" || t === "dark" ? t : "auto"; } catch { return "auto"; }
}

// Aplica no <html>: "auto" segue o sistema (prefers-color-scheme).
export function aplicarTema(t: Tema) {
  const html = document.documentElement;
  if (t === "auto") html.removeAttribute("data-theme"); else html.setAttribute("data-theme", t);
  const escuro = t === "dark" || (t === "auto" && !matchMedia("(prefers-color-scheme: light)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", escuro ? "#080B24" : "#F4F5FB");
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(lerTema);
  useEffect(() => {
    aplicarTema(tema);
    try { tema === "auto" ? localStorage.removeItem(CHAVE) : localStorage.setItem(CHAVE, tema); } catch { /* sem storage */ }
    if (tema !== "auto") return;
    const mq = matchMedia("(prefers-color-scheme: light)");
    const f = () => aplicarTema("auto");
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [tema]);
  return [tema, setTema] as const;
}
