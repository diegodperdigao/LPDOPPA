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

// Vários controles de tema na tela (topo e menu) ficam em sincronia por este evento.
const EVENTO = "doppa-tema";

export function useTema() {
  const [tema, setTemaLocal] = useState<Tema>(lerTema);
  useEffect(() => {
    const f = (e: Event) => setTemaLocal((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO, f);
    return () => window.removeEventListener(EVENTO, f);
  }, []);
  const setTema = (t: Tema) => { setTemaLocal(t); window.dispatchEvent(new CustomEvent(EVENTO, { detail: t })); };
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
