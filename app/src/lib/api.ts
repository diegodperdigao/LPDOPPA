import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { igValido, normalizaIg } from "./ig";

export type Segmento = "esp" | "cas";
export type Etapa = "regras" | "orient_perfil" | "orient_producao";

export interface Conta {
  id: string;
  nome: string;
  email: string;
  papel: "criador" | "admin";
  ig_esp: string | null;
  ig_cas: string | null;
  regras_em: string | null;
  perfis_em: string | null;
  orient_perfil_em: string | null;
  orient_producao_em: string | null;
  termo_em: string | null;
}

export interface Roteiro {
  id: string;
  data: string;
  segmento: Segmento;
  marca: string | null;
  titulo: string;
  texto: string;
  imagem_url: string | null;
}

export interface DadosTermo {
  nome: string;
  cpf: string;
  cnpj: string;
  telefone: string;
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
  roteirosDoDia(): Promise<Roteiro[]>;
}

export class ErroApp extends Error {}

function validaPerfis(esp: string, cas: string) {
  const e = normalizaIg(esp), c = normalizaIg(cas);
  if (!igValido(e)) throw new ErroApp("Confere o @ do perfil de Esportes.");
  if (!igValido(c)) throw new ErroApp("Confere o @ do perfil de Notícias/Variedades.");
  if (e === c) throw new ErroApp("Os dois perfis precisam ser diferentes: um pra cada segmento.");
  return { e, c };
}

// ---------------------------------------------------------------------------
// Supabase: toda escrita passa por funções (RPC) com as regras no banco.
// Ver supabase/migrations/0001_app_onboarding.sql.
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
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw new ErroApp("Não achamos uma conta com esse e-mail. Use o mesmo do cadastro.");
    },
    async verificarCodigo(email, codigo) {
      const { error } = await sb.auth.verifyOtp({ email, token: codigo, type: "email" });
      if (error) throw new ErroApp("Código inválido ou expirado. Peça um novo.");
    },
    async sair() {
      await sb.auth.signOut();
    },
    async marcarEtapa(etapa) {
      await rpc("app_marcar_etapa", { p_etapa: etapa });
    },
    async vincularPerfis(esp, cas) {
      const { e, c } = validaPerfis(esp, cas);
      await rpc("app_vincular_perfis", { p_esp: e, p_cas: c });
    },
    async aceitarTermo(d) {
      await rpc("app_aceitar_termo", { p_dados: { ...d, user_agent: navigator.userAgent } });
    },
    async roteirosDoDia() {
      const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
      const { data, error } = await sb
        .from("roteiros")
        .select("id,data,segmento,marca,titulo,texto,imagem_url")
        .eq("data", hoje)
        .order("ordem");
      if (error) throw new ErroApp(error.message);
      return (data ?? []) as Roteiro[];
    },
  };
}

// ---------------------------------------------------------------------------
// Demo: tudo no navegador, pra clicar no fluxo antes do banco estar pronto.
// ---------------------------------------------------------------------------
const DEMO_KEY = "doppa_demo_conta";

function apiDemo(): Api {
  const ler = (): Conta | null => {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch { return null; }
  };
  const gravar = (c: Conta | null) => {
    try { c ? localStorage.setItem(DEMO_KEY, JSON.stringify(c)) : localStorage.removeItem(DEMO_KEY); } catch { /* sem storage */ }
  };
  const agora = () => new Date().toISOString();
  const mudar = (patch: Partial<Conta>) => {
    const c = ler();
    if (!c) throw new ErroApp("Sessão expirada.");
    gravar({ ...c, ...patch });
  };
  return {
    modo: "demo",
    async conta() { return ler(); },
    async enviarCodigo() { /* demo: qualquer código de 6 dígitos serve */ },
    async verificarCodigo(email, codigo) {
      if (!/^\d{6}$/.test(codigo)) throw new ErroApp("Digite os 6 números do código.");
      gravar({
        id: "demo", nome: email.split("@")[0], email, papel: "criador",
        ig_esp: null, ig_cas: null, regras_em: null, perfis_em: null,
        orient_perfil_em: null, orient_producao_em: null, termo_em: null,
      });
    },
    async sair() { gravar(null); },
    async marcarEtapa(etapa) { mudar({ [`${etapa}_em`]: agora() } as Partial<Conta>); },
    async vincularPerfis(esp, cas) {
      const { e, c } = validaPerfis(esp, cas);
      mudar({ ig_esp: e, ig_cas: c, perfis_em: agora() });
    },
    async aceitarTermo(d) {
      if (d.cpf.replace(/\D/g, "").length !== 11) throw new ErroApp("CPF precisa ter 11 números.");
      mudar({ termo_em: agora() });
    },
    async roteirosDoDia() {
      const hoje = new Date().toISOString().slice(0, 10);
      return [
        { id: "1", data: hoje, segmento: "esp", marca: "kingpanda", titulo: "Virada histórica no clássico", imagem_url: null,
          texto: "EXEMPLO — Você viu o que aconteceu ontem? O time estava perdendo por dois a zero e virou nos últimos dez minutos...\n\nE se você curte sentir essa emoção valendo, no King Panda tem odd turbinada todo dia. Link na bio. +18, aposte com responsabilidade." },
        { id: "2", data: hoje, segmento: "esp", marca: "superbet", titulo: "Artilheiro em alta", imagem_url: null,
          texto: "EXEMPLO — Quinto jogo seguido marcando. Ninguém segura esse cara...\n\nNa Superbet você acompanha cada lance. Link na bio. +18." },
        { id: "3", data: hoje, segmento: "cas", marca: "kingpanda", titulo: "A fofoca do dia", imagem_url: null,
          texto: "EXEMPLO — Gente, vocês não vão acreditar no que aconteceu com aquela famosa ontem à noite...\n\nE falando em surpresa, no King Panda a Hora do Panda turbina as odds. Link na bio. +18." },
      ];
    },
  };
}

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
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
