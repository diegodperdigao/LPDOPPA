import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, consumirSessaoDaUrl, supabase, type Conta } from "./api";

interface Ctx {
  conta: Conta | null;
  carregando: boolean;
  recarregar: () => Promise<void>;
}

const ContaCtx = createContext<Ctx>({ conta: null, carregando: true, recarregar: async () => {} });

export function ContaProvider({ children }: { children: React.ReactNode }) {
  const [conta, setConta] = useState<Conta | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try { setConta(await api.conta()); } catch { setConta(null); }
  }, []);

  useEffect(() => {
    (async () => {
      await consumirSessaoDaUrl();
      await recarregar();
      setCarregando(false);
    })();
    const sub = supabase?.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_OUT") setConta(null);
    });
    return () => sub?.data.subscription.unsubscribe();
  }, [recarregar]);

  return <ContaCtx.Provider value={{ conta, carregando, recarregar }}>{children}</ContaCtx.Provider>;
}

export const useConta = () => useContext(ContaCtx);

// Ordem do onboarding. "criar" não tem registro no banco: é o guia visual antes de vincular.
export const PASSOS = ["regras", "criar", "vincular", "perfil", "producao"] as const;
export type Passo = (typeof PASSOS)[number];

export function passoAtual(c: Conta): Passo | "pronto" {
  if (!c.regras_em) return "regras";
  if (!c.perfis_em) return "criar";
  if (!c.orient_perfil_em) return "perfil";
  if (!c.orient_producao_em) return "producao";
  return "pronto";
}
