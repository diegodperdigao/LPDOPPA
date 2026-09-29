// Lê o Doc de roteiros do dia (texto colado ou exportado) e monta os roteiros.
// Formato de hoje (ex.: Roteiros_25_09):
//   "N. Título" ou "N - Título" (cabeçalho), Créditos/Foto, #publi #marca + rodapé legal,
//   "Instruções: Postar como Reels/Feed na sua página de X", bullets (React), "Roteiro:" + texto,
//   "PRONÚNCIA: ...", "Card a partir daqui" (fofoca com 2 imagens) e o aviso
//   ">> A PARTIR DAQUI DEVE PUBLICAR NA SUA CONTA DE NOTÍCIAS/VARIEDADES <<".
import type { Segmento } from "./api";

export type TipoRoteiro = "roteiro" | "react" | "fofoca";
export interface RoteiroLido {
  numero: number;
  titulo: string;
  segmento: Segmento;
  marca: string | null;
  tipo: TipoRoteiro;
  creditos: string | null;
  legenda: string | null;
  instrucoes: string | null;
  texto: string;
  pronuncia: string | null;
  avisos: string[];
}

// Tira marcação de Markdown/escapes que vêm do export do Google Docs.
// Primeiro sai o "# " de título (com espaço, pra não comer o "#publi"), depois os escapes.
const limpa = (s: string) =>
  s.replace(/^\s*#{1,6}(\s+|$)/, "").replace(/\\([#!+><_\-*.()[\]])/g, "$1").replace(/\*\*/g, "").trim();

const CABECALHO = /^(\d{1,3})\s*[.\-–—)]\s+(.+)$/;
const SEPARADOR = /^[━—─\-_=~]{5,}$/;
const SECAO_NOT = /a partir daqui.*(not[íi]cias|variedades)/i;
const SECAO_ESP = /a partir daqui.*(esporte|apostas)/i;

export function lerRoteiros(bruto: string): { roteiros: RoteiroLido[]; avisosGerais: string[] } {
  const linhasBrutas = bruto.replace(/\r/g, "").split("\n");
  // No Markdown os roteiros são títulos (#). No texto colado, vale a sequência 1, 2, 3...
  const markdown = linhasBrutas.some((l) => /^#\s+\S/.test(l));
  const roteiros: RoteiroLido[] = [];
  const avisosGerais: string[] = [];
  let secao: Segmento = "esp";
  let notaSecao: string[] = [];
  let lendoNota = false;
  let atual: { numero: number; titulo: string; linhas: string[]; secao: Segmento; nota: string } | null = null;

  const fecha = () => { if (atual) roteiros.push(montar(atual.numero, atual.titulo, atual.linhas, atual.secao, atual.nota)); atual = null; };

  for (const bruta of linhasBrutas) {
    const l = limpa(bruta);
    const esperado = (roteiros.length + (atual ? 1 : 0)) + 1;
    const m = l.match(CABECALHO);
    const ehCabecalho = !!m && (markdown ? /^#/.test(bruta.trim()) : Number(m[1]) === esperado);
    if (m && ehCabecalho) {
      fecha();
      if (lendoNota) lendoNota = false;
      atual = { numero: Number(m[1]), titulo: m[2].trim(), linhas: [], secao, nota: notaSecao.join("\n").trim() };
      continue;
    }
    if (SECAO_NOT.test(l) || SECAO_ESP.test(l)) {
      fecha();
      secao = SECAO_NOT.test(l) ? "cas" : "esp";
      notaSecao = [];
      lendoNota = true;
      continue;
    }
    if (lendoNota) { if (l && !/^⬇/.test(l)) notaSecao.push(l); continue; }
    if (atual) atual.linhas.push(l);
    else if (l) avisosGerais.push(l);
  }
  fecha();

  // Confere a sequência.
  roteiros.forEach((r, i) => { if (r.numero !== i + 1) r.avisos.push(`Número fora de ordem (esperado ${i + 1}).`); });
  return { roteiros, avisosGerais };
}

function montar(numero: number, titulo: string, linhas: string[], secao: Segmento, notaSecao: string): RoteiroLido {
  const creditos: string[] = [];
  const rodape: string[] = [];
  const bullets: string[] = [];
  const durante: string[] = [];
  const texto: string[] = [];
  let hashtags = "";
  let instrucao = "";
  let pronuncia: string | null = null;
  let estado: "pre" | "texto" | "durante" = "pre";
  let marcadorRoteiro = false;

  for (const l of linhas) {
    if (!l) { if (estado === "texto" || (estado === "pre" && texto.length)) texto.push(""); continue; }
    if (SEPARADOR.test(l)) continue;
    let x: RegExpMatchArray | null;
    if ((x = l.match(/^Cr[ée]ditos:\s*(.+)$/i))) { creditos.push(`Créditos: ${x[1].trim()}`); continue; }
    if ((x = l.match(/^Foto:\s*(.+)$/i))) { creditos.push(`Foto: ${x[1].trim()}`); continue; }
    if (/^#publi\b/i.test(l)) { hashtags = l; continue; }
    if (/^\+?18\s*\|/.test(l) || /^Minist[ée]rio da Fazenda/i.test(l) || /^Publicidade$/i.test(l)) { rodape.push(l); continue; }
    if (/^A legenda é o título/i.test(l)) continue;
    if ((x = l.match(/^Instru[çc][õo]es:\s*(.+)$/i))) { instrucao = x[1].trim(); continue; }
    if ((x = l.match(/^[-•*]\s+(.+)$/))) { bullets.push(x[1].trim()); continue; }
    if (/^Durante o v[íi]deo/i.test(l)) { estado = "durante"; continue; }
    if (/^Roteiro:?$/i.test(l)) { estado = "texto"; marcadorRoteiro = true; continue; }
    if ((x = l.match(/^PRON[ÚU]NCIA:\s*(.+)$/i))) { pronuncia = x[1].trim(); continue; }
    if (/^(Foto inicial|Card\/foto ?2):?$/i.test(l)) continue;
    if (estado === "durante") { durante.push(l); continue; }
    texto.push(l);
  }

  const txt = texto.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const react = bullets.some((b) => /drive|remix/i.test(b)) || durante.length > 0;
  const fofoca = /card a partir daqui/i.test(txt);
  const tipo: TipoRoteiro = react ? "react" : fofoca ? "fofoca" : "roteiro";
  const segmento: Segmento = /not[íi]cias|variedades/i.test(instrucao) ? "cas" : /esporte|apostas/i.test(instrucao) ? "esp" : secao;
  const marca = /#superbet/i.test(hashtags) ? "superbet" : /#kingpanda/i.test(hashtags) ? "kingpanda" : null;

  const instrucoes = [
    instrucao && instrucao.replace(/\.$/, "") + ".",
    ...bullets.map((b) => `• ${b}`),
    durante.length ? `Durante o vídeo: ${durante.join(" ")}` : "",
    tipo === "fofoca" && notaSecao ? `\n${notaSecao}` : "",
  ].filter(Boolean).join("\n").trim();

  const legenda = hashtags ? [titulo, ...creditos, hashtags, ...rodape].join("\n") : null;

  const avisos: string[] = [];
  if (!hashtags) avisos.push("Sem hashtags e rodapé legal: a legenda não foi montada.");
  if (!instrucao) avisos.push(`Sem "Instruções": segmento definido pela seção (${secao === "cas" ? "Notícias" : "Esportes"}).`);
  if (tipo !== "react" && !txt) avisos.push("Roteiro sem texto.");
  if (tipo !== "react" && !marcadorRoteiro && txt) avisos.push('Sem "Roteiro:": todo o texto do bloco foi usado.');

  return {
    numero, titulo, segmento, marca, tipo,
    creditos: creditos.join(" · ") || null,
    legenda, instrucoes: instrucoes || null, texto: txt, pronuncia, avisos,
  };
}

// Nome do arquivo no Drive → roteiro: "4.png" é do 4; "25.1.png" é a 2ª imagem do 25; "27.mp4" é do 27.
export function numeroDoArquivo(nome: string): { numero: number; parte: number } | null {
  const base = nome.split("/").pop()!.replace(/\.(png|jpe?g|webp|gif|heic|mp4|mov|m4v|webm)$/i, "");
  const m = base.trim().match(/^(\d{1,3})(?:[._\- ](\d{1,2}))?$/);
  return m ? { numero: Number(m[1]), parte: m[2] ? Number(m[2]) : 0 } : null;
}
