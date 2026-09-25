import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { igValido, normalizaIg } from "./ig";

export type Segmento = "esp" | "cas";
export type Etapa = "regras" | "grupo" | "orient_perfil" | "orient_producao";

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
  imagem_url: string | null;
  ordem: number;
  publicado: boolean;
}
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
  enviarImagem(arquivo: File): Promise<string>;
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
      const { error } = await sb.auth.signInWithOtp({ email });
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
        .select("id,data,segmento,marca,titulo,texto,imagem_url,ordem,publicado")
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
    async enviarImagem(arquivo) {
      const ext = (arquivo.name.split(".").pop() || "jpg").toLowerCase();
      const caminho = `${hojeSP()}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("roteiros").upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (error) throw new ErroApp(error.message);
      return sb.storage.from("roteiros").getPublicUrl(caminho).data.publicUrl;
    },
  };
}

// ---------------------------------------------------------------------------
// Demo: tudo no navegador, pra clicar no fluxo sem banco.
// ---------------------------------------------------------------------------
const DEMO_KEY = "doppa_demo_conta";
const DEMO_ROT = "doppa_demo_roteiros";

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
    return [
      { id: "1", data: d, segmento: "esp", marca: "kingpanda", titulo: "Virada histórica no clássico", imagem_url: null, ordem: 0, publicado: true,
        texto: "EXEMPLO — Você viu o que aconteceu ontem? O time estava perdendo por dois a zero e virou nos últimos dez minutos...\n\nE se você curte sentir essa emoção valendo, no King Panda tem odd turbinada todo dia. Link na bio." },
      { id: "2", data: d, segmento: "esp", marca: "superbet", titulo: "Artilheiro em alta", imagem_url: null, ordem: 1, publicado: true,
        texto: "EXEMPLO — Quinto jogo seguido marcando. Ninguém segura esse cara...\n\nNa Superbet você acompanha cada lance. Link na bio." },
      { id: "3", data: d, segmento: "cas", marca: "kingpanda", titulo: "A fofoca do dia", imagem_url: null, ordem: 0, publicado: true,
        texto: "EXEMPLO — Gente, vocês não vão acreditar no que aconteceu com aquela famosa ontem à noite...\n\nE falando em surpresa, no King Panda a Hora do Panda turbina as odds. Link na bio." },
    ];
  };
  const todos = () => lerJ<Roteiro[]>(DEMO_ROT, exemplo());
  return {
    modo: "demo",
    async conta() { return ler(); },
    async enviarCodigo() { /* demo */ },
    async verificarCodigo(email, codigo) {
      if (!/^\d{6}$/.test(codigo)) throw new ErroApp("Digite os 6 números do código.");
      gravarJ(DEMO_KEY, {
        id: "demo", nome: email.split("@")[0], email, papel: email.startsWith("admin") ? "admin" : "criador",
        ig_esp: null, ig_cas: null, regras_em: null, perfis_em: null, grupo_em: null,
        orient_perfil_em: null, orient_producao_em: null, termo_em: null, wl_token: null,
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
    async roteiros(data) { return todos().filter((r) => r.data === data); },
    async painel() {
      // ciclo de exemplo: dia 24 do mês passado até hoje
      const hoje = new Date(hojeSP() + "T12:00:00");
      const ini = new Date(hoje); ini.setDate(24); if (hoje.getDate() < 24) ini.setMonth(ini.getMonth() - 1);
      const fim = new Date(ini); fim.setMonth(fim.getMonth() + 1); fim.setDate(23);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const days: Dia[] = [];
      let seed = 7;
      for (const d = new Date(ini); d <= hoje; d.setDate(d.getDate() + 1)) {
        seed = (seed * 9301 + 49297) % 233280;
        const t = Math.round((seed / 233280) * 40);
        const esp = Math.round(t * 0.6), cas = t - esp;
        days.push({ date: iso(d), esp, cas, videos: t, ok: t >= 30 });
      }
      let perfect = 0, streak = 0, run = 0;
      for (const d of days) { if (d.ok) { perfect++; run++; streak = Math.max(streak, run); } else run = 0; }
      const total = days.reduce((s, d) => s + d.videos, 0);
      const dm = (s: string) => s.slice(8, 10) + "/" + s.slice(5, 7);
      const label = `${dm(iso(ini))} — ${dm(iso(fim))}`;
      const restantes = Math.max(0, Math.round((fim.getTime() - hoje.getTime()) / 864e5));
      return {
        params: { meta: 30 },
        cycle: { start: iso(ini), end: iso(fim), label, isCurrent: true },
        cycles: [{ start: iso(ini), end: iso(fim), label, current: true }],
        my: { days, total, totalEsp: days.reduce((s, d) => s + d.esp, 0), totalCas: days.reduce((s, d) => s + d.cas, 0), perfect, streak, tickets: perfect * streak },
        atingiuMinimo: true,
        incentivo: { diasRestantes: restantes, potencial: restantes * 30 * 1.56 },
        mgmTotal: 42.5, mgmPagoTotal: 0, mgmItens: [{ nome: "Amigo Exemplo", videos: 540, valor: 42.5, pago: false, pago_em: null }],
        pagamento: null,
        premios: [{ origem: "Piñata", descricao: "Exemplo de prêmio", valor: 50, data: iso(ini) }],
        premiosTotal: 50,
      };
    },
    async salvarRoteiro(r) {
      const lista = todos();
      if (r.id) gravarJ(DEMO_ROT, lista.map((x) => (x.id === r.id ? { ...x, ...r } as Roteiro : x)));
      else gravarJ(DEMO_ROT, [...lista, { ...r, id: String(Date.now()) } as Roteiro]);
    },
    async excluirRoteiro(id) { gravarJ(DEMO_ROT, todos().filter((x) => x.id !== id)); },
    async enviarImagem(arquivo) {
      return await new Promise<string>((ok) => { const f = new FileReader(); f.onload = () => ok(String(f.result)); f.readAsDataURL(arquivo); });
    },
  };
}

const forcarDemo = new URLSearchParams(location.search).has("demo");
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
