// Textos do onboarding num lugar só, pra editar sem mexer nas telas.
// ⚠️ RASCUNHO: RODAPE (aviso do Ministério da Fazenda) e as dicas de produção
// precisam ser trocados pelos textos oficiais dos fóruns de orientação do Discord.

export const SEGMENTOS = {
  esp: { nome: "Esportes", curto: "Esportes", emoji: "⚽", cor: "var(--green)", exemploNome: "Bet do João ⚽", exemploUser: "betdojoao" },
  cas: { nome: "Notícias/Variedades", curto: "Notícias", emoji: "📰", cor: "var(--cyan)", exemploNome: "João News 📰", exemploUser: "joaonews" },
} as const;

export const REGRAS = [
  { icone: "🔞", titulo: "Só maiores de 18", texto: "O conteúdo é do mercado de apostas. Menor de idade não participa." },
  { icone: "🤝", titulo: "Respeito sempre", texto: "Com o time, com os outros criadores e com quem assiste seus vídeos." },
  { icone: "🚫", titulo: "Sem spam e sem divulgação paralela", texto: "Nos perfis da Doppa você posta só as campanhas da Doppa." },
  { icone: "🤖", titulo: "Nada de vídeo feito por IA", texto: "Vídeo com você gravando, mínimo de 30 segundos." },
];

// Bio oficial: a MESMA nos dois perfis. Texto e link precisam estar exatos, senão os vídeos podem não ser validados.
export const BIO_TEXTO = "Conheça agora o King Panda 👇";
export const BIO_LINK = "https://go.3c.gg/doppa";

// Os 5 itens que o coletor confere em cada legenda (ig_config.conformidade).
export const RODAPE_ITENS = ["#publi", "+18", "Aposte com Responsabilidade", "Aposta não é Investimento", "Aviso do Ministério da Fazenda"];
export const RODAPE =
  "#publi | +18 | Aposte com Responsabilidade | Aposta não é Investimento | [TEXTO OFICIAL DO AVISO DO MINISTÉRIO DA FAZENDA]";

export const DESTAQUES = [
  { emoji: "🔥", nome: "Promo" },
  { emoji: "❓", nome: "Como apostar" },
  { emoji: "🔞", nome: "Jogo responsável" },
];

export const PRODUCAO = [
  {
    icone: "📜", titulo: "Leia com teleprompter",
    passos: ["Abra o roteiro no app e toque em Copiar", "Cole num app de teleprompter (ex.: BIGVU, PromptSmart)", "Celular na altura dos olhos e grave olhando pra lente"],
  },
  {
    icone: "🎬", titulo: "Faça React",
    passos: ["Use o Remix do Instagram em cima de um vídeo do assunto", "Ou monte no Edits / CapCut: vídeo em cima, você embaixo", "Reaja com emoção nos primeiros 3 segundos"],
  },
  {
    icone: "🖼️", titulo: "Use as imagens do roteiro",
    passos: ["Cada roteiro pode vir com imagem pronta", "Salve direto no celular pelo botão do card", "Coloque como fundo ou corte no meio do vídeo"],
  },
  {
    icone: "⏱️", titulo: "Regras do vídeo",
    passos: ["Mínimo de 30 segundos", "Nada de IA: é você gravando", "Legenda sempre com o rodapé legal completo"],
  },
];

export const TERMO_VERSAO = "1.0";
export const TERMO_URL = "https://doppa.com.br/termo";
export const WHATSAPP_SUPORTE = "https://wa.me/5511936242999";
