import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { igValido, normalizaIg } from "./ig";

export type Segmento = "esp" | "cas";
export type Etapa = "regras" | "grupo" | "orient_perfil" | "orient_producao" | "criadores";

export interface Conta {
  id: string;
  nome: string;
  email: string;
  papel: "criador" | "admin";
  ig_esp: string | null;
  ig_cas: string | null;
  regras_em: string | null;
  perfis_em: string | null;
  grupo_em: string | null;
  orient_perfil_em: string | null;
  orient_producao_em: string | null;
  criadores_em: string | null;
  termo_em: string | null;
  wl_token: string | null;
  grupo_link: string | null;
}

export interface Roteiro {
  id: string;
  data: string;
  segmento: Segmento;
  marca: string | null;
  titulo: string;
  texto: string;
  // Imagens pra inserir no vídeo e vídeos base pro React.
  midias: Midia[];
  legenda: string | null;
  instrucoes: string | null;
  // "roteiro" (texto falado), "react" (reagir em cima do vídeo base), "fofoca" (2 imagens: foto + card)
  tipo: "roteiro" | "react" | "fofoca";
  creditos: string | null;
  pronuncia: string | null;
  ordem: number;
  publicado: boolean;
}
export interface Midia { url: string; tipo: "imagem" | "video"; nome: string; rotulo?: string }
export type RoteiroNovo = Omit<Roteiro, "id"> & { id?: string };

export interface DadosTermo { nome: string; cpf: string; cnpj: string; telefone: string }

// Modelo calculado pela edge function `wl` (a mesma da /wallet): ciclo, meta, sequência, pagamento.
export interface Dia { date: string; esp: number; cas: number; videos: number; ok: boolean }
export interface Painel {
  params: { meta: number };
  cycle: { start: string; end: string; label: string; isCurrent: boolean };
  cycles: { start: string; end: string; label: string; current: boolean }[];
  my: { days: Dia[]; total: number; totalEsp: number; totalCas: number; perfect: number; streak: number; tickets: number };
  atingiuMinimo: boolean;
  incentivo: { diasRestantes: number; potencial: number };
  mgmTotal: number; mgmPagoTotal: number;
  mgmItens: { nome: string; videos: number; valor: number; pago: boolean; pago_em: string | null }[];
  pagamento: { pago: boolean; valor: number; pago_em: string | null; obs: string | null } | null;
  premios: { origem: string; descricao: string | null; valor: number; data: string | null }[];
  premiosTotal: number;
}

export interface ContaAdmin {
  id: string; nome: string | null; email: string; telefone: string | null; btag: string | null; papel: string; criado_em: string;
  regras_em: string | null; perfis_em: string | null; grupo_em: string | null; orient_perfil_em: string | null;
  orient_producao_em: string | null; termo_em: string | null;
  ig_esp: string | null; ig_cas: string | null; status: string | null; videos_7d: number; ultimo_video: string | null;
}
export interface Legado { id: string; nome: string; ig_esp: string | null; ig_cas: string | null; status: string; videos_7d: number; ultimo_video: string | null }
export interface Funil { contas: ContaAdmin[]; legado: Legado[] }

export type StatusNf = "enviada" | "aprovada" | "recusada";
export interface NotaFiscal { id: string; ciclo_start: string; ciclo_end: string; numero: string; valor: number; status: StatusNf; motivo: string | null; enviada_em: string; arquivo_path: string }
export interface NotaAdmin extends NotaFiscal { criador_id: string; nome: string; ig_esp: string | null; email: string | null; telefone: string | null }
export interface EnvioNf { ciclo_start: string; ciclo_end: string; numero: string; valor: number; arquivo: File }

export type TipoAviso = "popup" | "faixa" | "mural";
export type TomAviso = "info" | "sucesso" | "alerta" | "urgente";
export type PublicoAviso = "todos" | "sem_termo" | "onboarding" | "sem_video_7d";
export interface Aviso { id: string; titulo: string; corpo: string; tipo: TipoAviso; tom: TomAviso; cta_texto: string | null; cta_url: string | null; inicio: string; lido: boolean }
export interface AvisoAdmin extends Omit<Aviso, "lido"> { publico: PublicoAviso; fim: string | null; ativo: boolean; criado_em: string; alcance: number; vistos: number; cliques: number }
export type AvisoNovo = { id?: string; titulo: string; corpo: string; tipo: TipoAviso; tom: TomAviso; publico: PublicoAviso; cta_texto: string | null; cta_url: string | null; inicio: string; fim: string | null; ativo: boolean };

export interface Campanha {
  id: string; titulo: string; ciclo: string | null; inicio: string; fim: string | null; marcas: string[];
  meta_dia: number | null; duracao_min: number | null; valor_mes: number | null; regras: string[]; corpo: string; publicado: boolean;
}
export type CampanhaNova = Omit<Campanha, "id"> & { id?: string };

export interface Api {
  modo: "demo" | "supabase";
  conta(): Promise<Conta | null>;
  enviarCodigo(email: string): Promise<void>;
  verificarCodigo(email: string, codigo: string): Promise<void>;
  sair(): Promise<void>;
  marcarEtapa(etapa: Etapa): Promise<void>;
  vincularPerfis(esp: string, cas: string): Promise<void>;
  aceitarTermo(dados: DadosTermo): Promise<void>;
  roteiros(data: string): Promise<Roteiro[]>;
  painel(token: string, ciclo?: string): Promise<Painel>;
  // admin
  salvarRoteiro(r: RoteiroNovo): Promise<void>;
  excluirRoteiro(id: string): Promise<void>;
  enviarMidia(arquivo: File): Promise<Midia>;
  minhasNfs(): Promise<NotaFiscal[]>;
  nfPrazoDias(): Promise<number>;
  enviarNf(e: EnvioNf): Promise<void>;
  nfUrl(path: string): Promise<string>;
  adminNfs(ciclo?: string): Promise<NotaAdmin[]>;
  adminNfRevisar(id: string, status: "aprovada" | "recusada", motivo?: string): Promise<void>;
  meusAvisos(): Promise<Aviso[]>;
  marcarAviso(id: string, clicou?: boolean): Promise<void>;
  adminAvisos(): Promise<AvisoAdmin[]>;
  salvarAviso(a: AvisoNovo): Promise<void>;
  excluirAviso(id: string): Promise<void>;
  campanhas(): Promise<Campanha[]>;
  adminCampanhas(): Promise<Campanha[]>;
  salvarCampanha(c: CampanhaNova): Promise<void>;
  excluirCampanha(id: string): Promise<void>;
  adminCriadores(): Promise<Funil>;
  adminConfig(): Promise<Record<string, string>>;
  adminConfigSalvar(chave: string, valor: string): Promise<void>;
}

export class ErroApp extends Error {}

export const hojeSP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

function validaPerfis(esp: string, cas: string) {
  const e = normalizaIg(esp), c = normalizaIg(cas);
  if (!igValido(e)) throw new ErroApp("Confere o @ do perfil de Esportes.");
  if (!igValido(c)) throw new ErroApp("Confere o @ do perfil de Notícias/Variedades.");
  if (e === c) throw new ErroApp("Os dois perfis precisam ser diferentes: um pra cada segmento.");
  return { e, c };
}

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ---------------------------------------------------------------------------
// Supabase: escrita sensível passa por RPC (regras no banco, ver supabase/migrations).
// ---------------------------------------------------------------------------
function apiSupabase(sb: SupabaseClient): Api {
  const rpc = async <T,>(fn: string, args?: Record<string, unknown>) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new ErroApp(error.message);
    return data as T;
  };
  return {
    modo: "supabase",
    async conta() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      return rpc<Conta>("app_minha_conta");
    },
    async enviarCodigo(email) {
      // O e-mail traz o código de 6 números (template com {{ .Token }}) e/ou o link: os dois entram no app.
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } });
      if (error) throw new ErroApp(error.status === 429 ? "Muitas tentativas. Espera um pouquinho e tenta de novo." : "Não deu pra enviar o código. Confere o e-mail.");
    },
    async verificarCodigo(email, codigo) {
      const { error } = await sb.auth.verifyOtp({ email, token: codigo, type: "email" });
      if (error) throw new ErroApp("Código inválido ou expirado. Peça um novo.");
    },
    async sair() { await sb.auth.signOut(); },
    async marcarEtapa(etapa) { await rpc("app_marcar_etapa", { p_etapa: etapa }); },
    async vincularPerfis(esp, cas) {
      const { e, c } = validaPerfis(esp, cas);
      await rpc("app_vincular_perfis", { p_esp: e, p_cas: c });
    },
    async aceitarTermo(d) {
      await rpc("app_aceitar_termo", { p_dados: { ...d, user_agent: navigator.userAgent } });
    },
    async roteiros(data) {
      const { data: rows, error } = await sb.from("roteiros")
        .select("id,data,segmento,marca,titulo,texto,midias,legenda,instrucoes,tipo,creditos,pronuncia,ordem,publicado")
        .eq("data", data).order("segmento").order("ordem").order("criado_em");
      if (error) throw new ErroApp(error.message);
      return (rows ?? []) as Roteiro[];
    },
    async painel(token, ciclo) {
      const u = new URL(`${URL_}/functions/v1/wl/data`);
      u.searchParams.set("id", token);
      if (ciclo) u.searchParams.set("cycle", ciclo);
      const r = await fetch(u);
      if (!r.ok) throw new ErroApp("Não deu pra carregar seus números agora.");
      return (await r.json()) as Painel;
    },
    async salvarRoteiro(r) {
      const { id, ...campos } = r;
      const q = id ? sb.from("roteiros").update(campos).eq("id", id) : sb.from("roteiros").insert(campos);
      const { error } = await q;
      if (error) throw new ErroApp(error.message);
    },
    async excluirRoteiro(id) {
      const { error } = await sb.from("roteiros").delete().eq("id", id);
      if (error) throw new ErroApp(error.message);
    },
    async enviarMidia(arquivo) {
      const ext = (arquivo.name.split(".").pop() || "jpg").toLowerCase();
      const caminho = `${hojeSP()}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("roteiros").upload(caminho, arquivo, { contentType: arquivo.type || undefined, upsert: false });
      if (error) throw new ErroApp(/exceeded|too large|size/i.test(error.message) ? `${arquivo.name}: arquivo maior que o limite do Storage.` : error.message);
      return { url: sb.storage.from("roteiros").getPublicUrl(caminho).data.publicUrl, tipo: arquivo.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(arquivo.name) ? "video" : "imagem", nome: arquivo.name };
    },
    async minhasNfs() {
      const { data, error } = await sb.from("notas_fiscais").select("id,ciclo_start,ciclo_end,numero,valor,status,motivo,enviada_em,arquivo_path").order("ciclo_start", { ascending: false });
      if (error) throw new ErroApp(error.message);
      return (data ?? []) as NotaFiscal[];
    },
    async nfPrazoDias() { return rpc<number>("app_nf_prazo_dias"); },
    async enviarNf(e) {
      const criador = await rpc<string | null>("app_meu_criador_id");
      if (!criador) throw new ErroApp("Vincule seus perfis primeiro.");
      const ext = (e.arquivo.name.split(".").pop() || "pdf").toLowerCase();
      const caminho = `${criador}/${e.ciclo_start}/${crypto.randomUUID()}.${ext}`;
      const up = await sb.storage.from("notas").upload(caminho, e.arquivo, { contentType: e.arquivo.type || undefined });
      if (up.error) throw new ErroApp(up.error.message.includes("mime") ? "Envie um PDF ou uma foto (JPG/PNG)." : up.error.message.includes("size") ? "Arquivo muito grande (máx. 10 MB)." : "Não deu pra enviar o arquivo.");
      await rpc("app_enviar_nf", { p_ciclo_start: e.ciclo_start, p_ciclo_end: e.ciclo_end, p_numero: e.numero, p_valor: e.valor, p_path: caminho });
    },
    async nfUrl(path) {
      const { data, error } = await sb.storage.from("notas").createSignedUrl(path, 300);
      if (error || !data) throw new ErroApp("Não deu pra abrir o arquivo.");
      return data.signedUrl;
    },
    async adminNfs(ciclo) { return rpc<NotaAdmin[]>("app_admin_nfs", ciclo ? { p_ciclo_start: ciclo } : {}); },
    async adminNfRevisar(id, status, motivo) { await rpc("app_admin_nf_revisar", { p_id: id, p_status: status, p_motivo: motivo ?? null }); },
    async meusAvisos() { return rpc<Aviso[]>("app_meus_avisos"); },
    async marcarAviso(id, clicou) { await rpc("app_marcar_aviso", { p_id: id, p_clicou: !!clicou }); },
    async adminAvisos() { return rpc<AvisoAdmin[]>("app_admin_avisos"); },
    async salvarAviso(a) {
      const { id, ...campos } = a;
      const { error } = id ? await sb.from("avisos").update(campos).eq("id", id) : await sb.from("avisos").insert(campos);
      if (error) throw new ErroApp(error.message);
    },
    async excluirAviso(id) {
      const { error } = await sb.from("avisos").delete().eq("id", id);
      if (error) throw new ErroApp(error.message);
    },
    async campanhas() {
      const { data, error } = await sb.from("campanhas").select("*").eq("publicado", true).order("inicio", { ascending: false });
      if (error) throw new ErroApp(error.message);
      return (data ?? []) as Campanha[];
    },
    async adminCampanhas() {
      const { data, error } = await sb.from("campanhas").select("*").order("inicio", { ascending: false });
      if (error) throw new ErroApp(error.message);
      return (data ?? []) as Campanha[];
    },
    async salvarCampanha(c) {
      const { id, ...campos } = c;
      const { error } = id ? await sb.from("campanhas").update(campos).eq("id", id) : await sb.from("campanhas").insert(campos);
      if (error) throw new ErroApp(error.message);
    },
    async excluirCampanha(id) {
      const { error } = await sb.from("campanhas").delete().eq("id", id);
      if (error) throw new ErroApp(error.message);
    },
    async adminCriadores() { return rpc<Funil>("app_admin_criadores"); },
    async adminConfig() { return rpc<Record<string, string>>("app_admin_config"); },
    async adminConfigSalvar(chave, valor) { await rpc("app_admin_config_salvar", { p_chave: chave, p_valor: valor }); },
  };
}

// ---------------------------------------------------------------------------
// Demo: tudo no navegador, pra clicar no fluxo sem banco.
// ---------------------------------------------------------------------------
const DEMO_KEY = "doppa_demo_conta";
const DEMO_ROT = "doppa_demo_roteiros";
const DEMO_NF = "doppa_demo_nfs";
const DEMO_AVISOS = "doppa_demo_avisos";
const DEMO_LIDOS = "doppa_demo_avisos_lidos";
const DEMO_CAMP = "doppa_demo_campanhas";
// Exemplo com os números do post do ciclo 3 no Discord (#campanhas-ativas).
const campanhasExemplo = (): Campanha[] => {
  const base = { marcas: ["kingpanda", "superbet"], meta_dia: 30, duracao_min: 30, valor_mes: 1400, publicado: true,
    regras: ["Vídeos com no mínimo 30 segundos", "Nada de IA: é você gravando", "Rodapé legal completo em toda legenda", "Hashtag da marca do roteiro (#kingpanda, #superbet)"] };
  return [
    { ...base, id: "c4", titulo: "King Panda + Superbet", ciclo: "Ciclo 4", inicio: "2026-09-26", fim: "2026-10-26",
      corpo: "EXEMPLO: aqui entra o texto do post da campanha, do jeito que ia pro Discord. Metas, bônus, datas importantes e o que muda nesse ciclo." },
    { ...base, id: "c3", titulo: "King Panda + Superbet", ciclo: "Ciclo 3", inicio: "2026-08-26", fim: "2026-09-25", corpo: "" },
  ];
};
const avisosExemplo = (): AvisoAdmin[] => {
  const ontem = new Date(Date.now() - 864e5).toISOString();
  return [
    { id: "a1", titulo: "Live de resultados na sexta", corpo: "Vamos mostrar quem mais postou na semana e tirar dúvidas ao vivo, às 19h.", tipo: "mural", tom: "sucesso", publico: "todos", cta_texto: "Ver roteiros", cta_url: "/roteiros", inicio: ontem, fim: null, ativo: true, criado_em: ontem, alcance: 60, vistos: 41, cliques: 18 },
    { id: "a2", titulo: "NF do ciclo 3 até 28/09", corpo: "Envie sua nota fiscal pela Carteira pra receber sem atraso.", tipo: "faixa", tom: "alerta", publico: "todos", cta_texto: "Enviar NF", cta_url: "/carteira", inicio: ontem, fim: null, ativo: true, criado_em: ontem, alcance: 60, vistos: 22, cliques: 9 },
    { id: "a3", titulo: "Dica: grave em lote", corpo: "Separe um horário fixo e grave vários roteiros de uma vez. Rende muito mais.", tipo: "mural", tom: "info", publico: "todos", cta_texto: null, cta_url: null, inicio: ontem, fim: null, ativo: true, criado_em: ontem, alcance: 60, vistos: 12, cliques: 0 },
  ];
};

function apiDemo(): Api {
  const lerJ = <T,>(k: string, pad: T): T => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? pad; } catch { return pad; } };
  const gravarJ = (k: string, v: unknown) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } };
  const ler = () => lerJ<Conta | null>(DEMO_KEY, null);
  const agora = () => new Date().toISOString();
  const mudar = (patch: Partial<Conta>) => {
    const c = ler();
    if (!c) throw new ErroApp("Sessão expirada.");
    gravarJ(DEMO_KEY, { ...c, ...patch });
  };
  const exemplo = (): Roteiro[] => {
    const d = hojeSP();
    const img = (nome: string, url: string): Midia => ({ url, tipo: "imagem", nome });
    const base = { ordem: 0, publicado: true, legenda: null as string | null, instrucoes: null as string | null, tipo: "roteiro" as const, creditos: null, pronuncia: null };
    return [
      { ...base, id: "1", data: d, segmento: "esp", marca: "kingpanda", titulo: "Virada histórica no clássico",
        midias: [img("placar.webp", "/mascote.webp"), img("jogador.png", "/doppa-eye.png")],
        legenda: "EXEMPLO: Que virada foi essa?! 🔥 #kingpanda #publi +18 Aposte com responsabilidade.",
        instrucoes: "Use a imagem do placar no começo e a do jogador no fim. Poste no perfil de Esportes.",
        texto: "EXEMPLO — Você viu o que aconteceu ontem? O time estava perdendo por dois a zero e virou nos últimos dez minutos...\n\nE se você curte sentir essa emoção valendo, no King Panda tem odd turbinada todo dia. Link na bio." },
      { ...base, id: "2", data: d, segmento: "esp", marca: "superbet", titulo: "Artilheiro em alta", ordem: 1,
        midias: [img("artilheiro.webp", "/mascote.webp")],
        legenda: "EXEMPLO: Ninguém segura! ⚽ #superbet #publi +18",
        texto: "EXEMPLO — Quinto jogo seguido marcando. Ninguém segura esse cara...\n\nNa Superbet você acompanha cada lance. Link na bio." },
      { ...base, id: "3", data: d, segmento: "cas", marca: "kingpanda", titulo: "A fofoca do dia", midias: [],
        instrucoes: "Faça React em cima do vídeo base. Poste no perfil de Notícias/Variedades.",
        texto: "EXEMPLO — Gente, vocês não vão acreditar no que aconteceu com aquela famosa ontem à noite...\n\nE falando em surpresa, no King Panda a Hora do Panda turbina as odds. Link na bio." },
    ];
  };
  // Demo abre com os 30 roteiros reais do Doc de 25/09 como se fossem de hoje.
  // As imagens são o mascote no lugar dos arquivos do Drive (os reais entram pelo importador).
  let docExemplo: Roteiro[] | null = null;
  async function carregarDoc() {
    if (docExemplo) return;
    const [{ default: bruto }, { lerRoteiros }] = await Promise.all([import("../demo/roteiros-25-09.md?raw"), import("./importar")]);
    const d = hojeSP();
    docExemplo = lerRoteiros(bruto).roteiros.map((r) => ({
      id: `doc-${r.numero}`, data: d, segmento: r.segmento, marca: r.marca, titulo: r.titulo, texto: r.texto,
      legenda: r.legenda, instrucoes: r.instrucoes, tipo: r.tipo, creditos: r.creditos, pronuncia: r.pronuncia, ordem: r.numero, publicado: true,
      midias: r.tipo === "react" ? [] : r.tipo === "fofoca"
        ? [{ url: "/mascote.webp", tipo: "imagem", nome: `${r.numero}.jpg`, rotulo: "Foto inicial" }, { url: "/doppa-eye.png", tipo: "imagem", nome: `${r.numero}.1.png`, rotulo: "Card" }]
        : [{ url: "/mascote.webp", tipo: "imagem", nome: `${r.numero}.png`, rotulo: "Imagem" }],
    }));
  }
  const todos = () => lerJ<Roteiro[]>(DEMO_ROT, docExemplo ?? exemplo());
  return {
    modo: "demo",
    async conta() { return ler(); },
    async enviarCodigo() { /* demo */ },
    async verificarCodigo(email, codigo) {
      if (!/^\d{6}$/.test(codigo)) throw new ErroApp("Digite os 6 números do código.");
      gravarJ(DEMO_KEY, {
        id: "demo", nome: email.split("@")[0], email, papel: email.startsWith("admin") ? "admin" : "criador",
        ig_esp: null, ig_cas: null, regras_em: null, perfis_em: null, grupo_em: null,
        orient_perfil_em: null, orient_producao_em: null, criadores_em: null, termo_em: null, wl_token: null,
        grupo_link: "https://chat.whatsapp.com/EXEMPLO",
      } satisfies Conta);
    },
    async sair() { gravarJ(DEMO_KEY, null); },
    async marcarEtapa(etapa) { mudar({ [`${etapa}_em`]: agora() } as Partial<Conta>); },
    async vincularPerfis(esp, cas) {
      const { e, c } = validaPerfis(esp, cas);
      mudar({ ig_esp: e, ig_cas: c, perfis_em: ler()?.perfis_em ?? agora(), wl_token: "demo" });
    },
    async aceitarTermo(d) {
      if (d.cpf.replace(/\D/g, "").length !== 11) throw new ErroApp("CPF precisa ter 11 números.");
      mudar({ termo_em: agora() });
    },
    async roteiros(data) { await carregarDoc().catch(() => {}); return todos().filter((r) => r.data === data); },
    async painel(_token, ciclo) {
      // ciclos de exemplo ancorados no dia 24: o atual e os 2 anteriores
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const dm = (x: string) => x.slice(8, 10) + "/" + x.slice(5, 7);
      const hoje = new Date(hojeSP() + "T12:00:00");
      const atualIni = new Date(hoje); atualIni.setDate(24); if (hoje.getDate() < 24) atualIni.setMonth(atualIni.getMonth() - 1);
      const bounds = (k: number) => { const i = new Date(atualIni); i.setMonth(i.getMonth() - k); const f = new Date(i); f.setMonth(f.getMonth() + 1); f.setDate(23); return { i, f }; };
      const cycles = [2, 1, 0].map((k) => { const { i, f } = bounds(k); return { start: iso(i), end: iso(f), label: `${dm(iso(i))} — ${dm(iso(f))}`, current: k === 0 }; });
      const alvo = cycles.find((c) => c.start === ciclo) ?? cycles[2];
      const ini = new Date(alvo.start + "T12:00:00"), fim = new Date(alvo.end + "T12:00:00");
      // a contagem sai no dia seguinte: no ciclo atual, os dias vão só até ontem
      const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
      const ate = alvo.current ? ontem : fim;
      const days: Dia[] = [];
      let seed = 7 + ini.getMonth();
      for (const d = new Date(ini); d <= ate; d.setDate(d.getDate() + 1)) {
        seed = (seed * 9301 + 49297) % 233280;
        const t = Math.round((seed / 233280) * 40);
        const esp = Math.round(t * 0.6), cas = t - esp;
        days.push({ date: iso(d), esp, cas, videos: t, ok: t >= 30 });
      }
      let perfect = 0, streak = 0, run = 0;
      for (const d of days) { if (d.ok) { perfect++; run++; streak = Math.max(streak, run); } else run = 0; }
      const total = days.reduce((s, d) => s + d.videos, 0);
      const restantes = alvo.current ? Math.max(0, Math.round((fim.getTime() - hoje.getTime()) / 864e5)) : 0;
      return {
        params: { meta: 30 },
        cycle: { start: alvo.start, end: alvo.end, label: alvo.label, isCurrent: alvo.current },
        cycles,
        my: { days, total, totalEsp: days.reduce((s, d) => s + d.esp, 0), totalCas: days.reduce((s, d) => s + d.cas, 0), perfect, streak, tickets: perfect * streak },
        atingiuMinimo: true,
        incentivo: { diasRestantes: restantes, potencial: restantes * 30 * 1.56 },
        mgmTotal: 42.5, mgmPagoTotal: 0, mgmItens: [{ nome: "Amigo Exemplo", videos: 540, valor: 42.5, pago: false, pago_em: null }],
        pagamento: null,
        premios: [{ origem: "Piñata", descricao: "Exemplo de prêmio", valor: 50, data: alvo.start }],
        premiosTotal: 50,
      };
    },
    async salvarRoteiro(r) {
      await carregarDoc().catch(() => {});
      const lista = todos();
      if (r.id) gravarJ(DEMO_ROT, lista.map((x) => (x.id === r.id ? { ...x, ...r } as Roteiro : x)));
      else gravarJ(DEMO_ROT, [...lista, { ...r, id: crypto.randomUUID() } as Roteiro]);
    },
    async excluirRoteiro(id) { await carregarDoc().catch(() => {}); gravarJ(DEMO_ROT, todos().filter((x) => x.id !== id)); },
    async enviarMidia(arquivo) {
      // Na demo o arquivo fica só na memória desta aba (some ao recarregar).
      return { url: URL.createObjectURL(arquivo), tipo: arquivo.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(arquivo.name) ? "video" : "imagem", nome: arquivo.name };
    },
    async minhasNfs() { return lerJ<NotaFiscal[]>(DEMO_NF, []); },
    async nfPrazoDias() { return 5; },
    async enviarNf(e) {
      if (e.ciclo_end >= hojeSP()) throw new ErroApp("A NF desse ciclo só pode ser enviada depois que ele fechar.");
      const url = await new Promise<string>((ok) => { const f = new FileReader(); f.onload = () => ok(String(f.result)); f.readAsDataURL(e.arquivo); });
      const lista = lerJ<NotaFiscal[]>(DEMO_NF, []).filter((n) => n.ciclo_start !== e.ciclo_start);
      gravarJ(DEMO_NF, [{ id: String(Date.now()), ciclo_start: e.ciclo_start, ciclo_end: e.ciclo_end, numero: e.numero, valor: e.valor, status: "enviada", motivo: null, enviada_em: agora(), arquivo_path: url }, ...lista]);
    },
    async nfUrl(path) { return path; },
    async adminNfs() {
      return lerJ<NotaFiscal[]>(DEMO_NF, []).map((n) => ({ ...n, criador_id: "demo", nome: ler()?.nome ?? "Criador", ig_esp: ler()?.ig_esp ?? null, email: ler()?.email ?? null, telefone: null }));
    },
    async adminNfRevisar(id, status, motivo) {
      gravarJ(DEMO_NF, lerJ<NotaFiscal[]>(DEMO_NF, []).map((n) => (n.id === id ? { ...n, status, motivo: status === "recusada" ? motivo ?? null : null } : n)));
    },
    async meusAvisos() {
      const lidos = lerJ<Record<string, boolean>>(DEMO_LIDOS, {});
      const agoraMs = Date.now();
      return lerJ<AvisoAdmin[]>(DEMO_AVISOS, avisosExemplo())
        .filter((a) => a.ativo && new Date(a.inicio).getTime() <= agoraMs && (!a.fim || new Date(a.fim).getTime() > agoraMs))
        .map((a) => ({ id: a.id, titulo: a.titulo, corpo: a.corpo, tipo: a.tipo, tom: a.tom, cta_texto: a.cta_texto, cta_url: a.cta_url, inicio: a.inicio, lido: !!lidos[a.id] }));
    },
    async marcarAviso(id) { gravarJ(DEMO_LIDOS, { ...lerJ<Record<string, boolean>>(DEMO_LIDOS, {}), [id]: true }); },
    async adminAvisos() { return lerJ<AvisoAdmin[]>(DEMO_AVISOS, avisosExemplo()); },
    async salvarAviso(a) {
      const lista = lerJ<AvisoAdmin[]>(DEMO_AVISOS, avisosExemplo());
      if (a.id) gravarJ(DEMO_AVISOS, lista.map((x) => (x.id === a.id ? { ...x, ...a } as AvisoAdmin : x)));
      else gravarJ(DEMO_AVISOS, [{ ...a, id: String(Date.now()), criado_em: agora(), alcance: 1, vistos: 0, cliques: 0 } as AvisoAdmin, ...lista]);
    },
    async excluirAviso(id) { gravarJ(DEMO_AVISOS, lerJ<AvisoAdmin[]>(DEMO_AVISOS, avisosExemplo()).filter((x) => x.id !== id)); },
    async campanhas() { return lerJ<Campanha[]>(DEMO_CAMP, campanhasExemplo()).filter((c) => c.publicado).sort((a, b) => b.inicio.localeCompare(a.inicio)); },
    async adminCampanhas() { return lerJ<Campanha[]>(DEMO_CAMP, campanhasExemplo()).sort((a, b) => b.inicio.localeCompare(a.inicio)); },
    async salvarCampanha(c) {
      const lista = lerJ<Campanha[]>(DEMO_CAMP, campanhasExemplo());
      if (c.id) gravarJ(DEMO_CAMP, lista.map((x) => (x.id === c.id ? { ...x, ...c } as Campanha : x)));
      else gravarJ(DEMO_CAMP, [{ ...c, id: String(Date.now()) }, ...lista]);
    },
    async excluirCampanha(id) { gravarJ(DEMO_CAMP, lerJ<Campanha[]>(DEMO_CAMP, campanhasExemplo()).filter((x) => x.id !== id)); },
    async adminCriadores() {
      const d = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
      const base = { btag: null, papel: "criador", telefone: "11999990000", status: "ativo", ig_esp: null, ig_cas: null, regras_em: null, perfis_em: null, grupo_em: null, orient_perfil_em: null, orient_producao_em: null, termo_em: null, videos_7d: 0, ultimo_video: null };
      return {
        contas: [
          { ...base, id: "a", nome: "Ana Souza", email: "ana@x.com", criado_em: d(0) },
          { ...base, id: "b", nome: "Bruno Lima", email: "bruno@x.com", criado_em: d(1), regras_em: d(1) },
          { ...base, id: "c", nome: "Carla Dias", email: "carla@x.com", criado_em: d(2), regras_em: d(2), perfis_em: d(2), ig_esp: "carla_fut", ig_cas: "carla.news" },
          { ...base, id: "e", nome: "Eduarda Faria", email: "edu@x.com", criado_em: d(5), regras_em: d(5), perfis_em: d(5), grupo_em: d(5), orient_perfil_em: d(5), orient_producao_em: d(5), termo_em: d(4), ig_esp: "edu_bet", ig_cas: "edu.news", videos_7d: 190, ultimo_video: d(1).slice(0, 10) },
        ],
        legado: [{ id: "l1", nome: "Criador Antigo", ig_esp: "antigo_fut", ig_cas: "antigo.news", status: "ativo", videos_7d: 120, ultimo_video: d(1).slice(0, 10) }],
      };
    },
    async adminConfig() { return { grupo_whatsapp: ler()?.grupo_link ?? "" }; },
    async adminConfigSalvar(chave, valor) { if (chave === "grupo_whatsapp") mudar({ grupo_link: valor }); },
  };
}

const forcarDemo = import.meta.env.VITE_DEMO === "1" || new URLSearchParams(location.search).has("demo");
export const supabase = URL_ && KEY && !forcarDemo ? createClient(URL_, KEY) : null;
export const api: Api = supabase ? apiSupabase(supabase) : apiDemo();

// Conta criada no formulário da VSL: a LP verifica o código e manda a sessão no
// fragmento da URL (#at=...&rt=...). O fragmento não vai pro servidor; limpamos logo.
export async function consumirSessaoDaUrl() {
  if (!supabase || !location.hash.includes("at=")) return;
  const p = new URLSearchParams(location.hash.slice(1));
  const at = p.get("at"), rt = p.get("rt");
  history.replaceState(null, "", location.pathname + location.search);
  if (at && rt) await supabase.auth.setSession({ access_token: at, refresh_token: rt });
}

export const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const ddmm = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);
