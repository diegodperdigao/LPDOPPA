import { hojeSP, type Campanha } from "./api";
import { MARCAS } from "../content";

// Vale a que já começou e não terminou; senão, a mais recente.
export function campanhaAtual(lista: Campanha[]) {
  const hoje = hojeSP();
  return lista.find((c) => c.inicio <= hoje && (!c.fim || c.fim >= hoje)) ?? lista[0] ?? null;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const dataExtenso = (iso: string) => `${Number(iso.slice(8, 10))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;

// "King Panda e Superbet"
export function marcasTexto(c: Campanha) {
  const n = c.marcas.map((m) => MARCAS[m] ?? m);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} e ${n[n.length - 1]}` : n[0] ?? "";
}
