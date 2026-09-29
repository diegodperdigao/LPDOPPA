import { hojeSP } from "./api";

// No máximo um pop-up por dia (ciclo, termo ou aviso). O resto espera o dia seguinte
// e continua acessível pelo sino / pelos cards.
const CHAVE = "doppa_popup_dia";

export function podeAbrirPopup() {
  try { return localStorage.getItem(CHAVE) !== hojeSP(); } catch { return true; }
}
export function registrarPopup() {
  try { localStorage.setItem(CHAVE, hojeSP()); } catch { /* sem storage */ }
}
