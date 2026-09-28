import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Aviso } from "./api";
import { passoAtual, useConta } from "./conta";

interface Ctx { avisos: Aviso[]; naoLidos: number; marcar: (id: string, clicou?: boolean) => void; recarregar: () => void }
const AvisosCtx = createContext<Ctx>({ avisos: [], naoLidos: 0, marcar: () => {}, recarregar: () => {} });

// Carrega os avisos uma vez por sessão (e a cada volta pro app), só pra quem já terminou o onboarding.
export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const { conta } = useConta();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const pronto = !!conta && (passoAtual(conta) === "pronto" || conta.papel === "admin");

  const recarregar = useCallback(() => {
    if (!pronto) { setAvisos([]); return; }
    api.meusAvisos().then(setAvisos).catch(() => {});
  }, [pronto]);

  useEffect(() => {
    recarregar();
    const volta = () => document.visibilityState === "visible" && recarregar();
    document.addEventListener("visibilitychange", volta);
    return () => document.removeEventListener("visibilitychange", volta);
  }, [recarregar]);

  const marcar = useCallback((id: string, clicou?: boolean) => {
    setAvisos((l) => l.map((a) => (a.id === id ? { ...a, lido: true } : a)));
    api.marcarAviso(id, clicou).catch(() => {});
  }, []);

  return (
    <AvisosCtx.Provider value={{ avisos, naoLidos: avisos.filter((a) => !a.lido).length, marcar, recarregar }}>
      {children}
    </AvisosCtx.Provider>
  );
}

export const useAvisos = () => useContext(AvisosCtx);
