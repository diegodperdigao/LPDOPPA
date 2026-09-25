import { useEffect, useState } from "react";
import { api, type Painel } from "./api";
import { useConta } from "./conta";

// Cache simples por sessão: Início e Carteira usam o mesmo dado sem buscar duas vezes.
const cache = new Map<string, Painel>();

export function usePainel(ciclo?: string) {
  const { conta } = useConta();
  const token = conta?.wl_token ?? null;
  const chave = `${token}|${ciclo ?? ""}`;
  const [dados, setDados] = useState<Painel | null>(cache.get(chave) ?? null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    setErro("");
    if (cache.has(chave)) setDados(cache.get(chave)!);
    api.painel(token, ciclo)
      .then((d) => { cache.set(chave, d); if (vivo) setDados(d); })
      .catch((e) => vivo && setErro(e.message || "Erro ao carregar."));
    return () => { vivo = false; };
  }, [chave, token, ciclo]);

  return { dados, erro, semCarteira: !token };
}

// Último dia com produção registrada (a contagem vem da planilha, não é tempo real).
export function ultimaContagem(p: Painel) {
  for (let i = p.my.days.length - 1; i >= 0; i--) if (p.my.days[i].videos > 0) return p.my.days[i];
  return null;
}
