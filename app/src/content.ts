// Textos do app num lugar só, pra editar sem mexer nas telas.
// ⚠️ RASCUNHO: RODAPE (aviso do Ministério da Fazenda) e as dicas de produção
// precisam ser trocados pelos textos oficiais dos fóruns de orientação do Discord.
import { Ban, Bot, HeartHandshake, ImageIcon, Lightbulb, MessagesSquare, Newspaper, ScrollText, ShieldCheck, Sparkles, Timer, Trophy, Video, type LucideIcon } from "lucide-react";
import type { Missao } from "./lib/conta";
import type { TelaIg } from "./components/Phone";
import type { Tom } from "./components/Icon";

export const SEGMENTOS: Record<"esp" | "cas", { nome: string; curto: string; icon: LucideIcon; tom: Tom; exemploNome: string; exemploUser: string }> = {
  esp: { nome: "Esportes", curto: "Esportes", icon: Trophy, tom: "green", exemploNome: "Bet do João", exemploUser: "betdojoao" },
  cas: { nome: "Notícias/Variedades", curto: "Notícias", icon: Newspaper, tom: "cyan", exemploNome: "João News", exemploUser: "joaonews" },
};

export const REGRAS: { icon: LucideIcon; tom: Tom; titulo: string; texto: string }[] = [
  { icon: ShieldCheck, tom: "violet", titulo: "Só maiores de 18", texto: "O conteúdo é do mercado de apostas. Menor de idade não participa." },
  { icon: HeartHandshake, tom: "green", titulo: "Respeito sempre", texto: "Com o time, com os outros criadores e com quem assiste seus vídeos." },
  { icon: Ban, tom: "red", titulo: "Sem spam e sem divulgação paralela", texto: "Nos perfis da Doppa você posta só as campanhas da Doppa." },
  { icon: Bot, tom: "yellow", titulo: "Nada de vídeo feito por IA", texto: "Vídeo com você gravando, mínimo de 30 segundos." },
];

// Bio oficial: a MESMA nos dois perfis. Texto e link precisam estar exatos, senão os vídeos podem não ser validados.
export const BIO_TEXTO = "Conheça agora o King Panda 👇";
export const BIO_LINK = "https://go.3c.gg/doppa";

// Os 5 itens que o coletor confere em cada legenda (ig_config.conformidade).
export const RODAPE_ITENS = ["#publi", "+18", "Aposte com Responsabilidade", "Aposta não é Investimento", "Aviso do Ministério da Fazenda"];
export const RODAPE =
  "#publi | +18 | Aposte com Responsabilidade | Aposta não é Investimento | [TEXTO OFICIAL DO AVISO DO MINISTÉRIO DA FAZENDA]";

export const DESTAQUES = ["Promo", "Como apostar", "Jogo responsável"];

export const PRODUCAO: { icon: LucideIcon; titulo: string; passos: string[] }[] = [
  {
    icon: ScrollText, titulo: "Leia com teleprompter",
    passos: ["Abra o roteiro no app e toque em Copiar", "Cole num app de teleprompter (ex.: BIGVU, PromptSmart)", "Celular na altura dos olhos e grave olhando pra lente"],
  },
  {
    icon: Video, titulo: "Faça React",
    passos: ["Use o Remix do Instagram em cima de um vídeo do assunto", "Ou monte no Edits / CapCut: vídeo em cima, você embaixo", "Reaja com emoção nos primeiros 3 segundos"],
  },
  {
    icon: ImageIcon, titulo: "Use as imagens do roteiro",
    passos: ["Cada roteiro pode vir com imagem pronta", "Salve direto no celular pelo botão do card", "Coloque como fundo ou corte no meio do vídeo"],
  },
  {
    icon: Timer, titulo: "Regras do vídeo",
    passos: ["Mínimo de 30 segundos", "Nada de IA: é você gravando", "Legenda sempre com o rodapé legal completo"],
  },
];

export const MARCAS: Record<string, string> = { kingpanda: "King Panda", superbet: "Superbet", doppa: "Doppa" };

export const TERMO_VERSAO = "1.0";
export const TERMO_URL = "https://doppa.com.br/termo";
export const WHATSAPP_SUPORTE = "https://wa.me/5511936242999";

// Depois dos perfis e dos primeiros vídeos (em ordem de prioridade): aparecem no Início até serem feitas.
export const MISSOES: { k: Missao; to: string; icon: LucideIcon; tom: Tom; t: string; d: string }[] = [
  { k: "gravar", to: "/missao/gravar", icon: Lightbulb, tom: "yellow", t: "Confira dicas de como gravar", d: "Teleprompter, React e o que faz um vídeo valer." },
  { k: "criadores", to: "/missao/criadores", icon: Sparkles, tom: "violet", t: "Conheça criadores que já criam com Doppa", d: "Veja como postam os perfis que já estão rodando." },
  { k: "grupo", to: "/missao/grupo", icon: MessagesSquare, tom: "cyan", t: "Entre na nossa comunidade do WhatsApp", d: "Avisos, dúvidas e desafios com os outros criadores." },
];

// ⚠️ RASCUNHO: trocar pelos @ reais de criadores que toparam aparecer.
export const CRIADORES_DESTAQUE: { nome: string; ig: string; segmento: "esp" | "cas"; frase: string }[] = [
  { nome: "Criador exemplo 1", ig: "exemplo.esportes", segmento: "esp", frase: "Posta notícia de futebol todo dia com React." },
  { nome: "Criador exemplo 2", ig: "exemplo.noticias", segmento: "cas", frase: "Fofoca e notícia com teleprompter, direto ao ponto." },
  { nome: "Criador exemplo 3", ig: "exemplo.bola", segmento: "esp", frase: "Grava na rua, reage aos lances da rodada." },
];

// Prints reais do Instagram pros slides de "Crie seus perfis" (arquivos em public/ig/).
// Enquanto uma tela não tiver print, o app mostra o desenho. "alvo" é o destaque amarelo,
// em % da imagem (x, y, largura, altura), por cima de onde a pessoa tem que tocar.
export type PrintIg = { src: string; alvo?: { x: number; y: number; w: number; h: number } };
export const PRINTS_IG: Partial<Record<TelaIg, PrintIg>> = {
  // trocar: { src: "/ig/1-trocar.jpg", alvo: { x: 4, y: 78, w: 92, h: 8 } },
};
