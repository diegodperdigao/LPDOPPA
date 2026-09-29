import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Roteiro } from "./api";

// Checks dos roteiros do dia. Marca na hora (otimista) e salva em seguida;
// se falhar, volta atrás e avisa.
export function useFeitos(roteiros: Roteiro[] | null) {
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState("");
  const chave = (roteiros ?? []).map((r) => r.id).join(",");
  const atual = useRef(feitos);
  atual.current = feitos;

  useEffect(() => {
    if (!chave) return;
    api.feitos(chave.split(",")).then((ids) => setFeitos(new Set(ids))).catch(() => {});
  }, [chave]);

  const marcar = useCallback(async (ids: string[], feito: boolean) => {
    if (!ids.length) return;
    const antes = new Set(atual.current);
    setFeitos((f) => { const n = new Set(f); ids.forEach((id) => (feito ? n.add(id) : n.delete(id))); return n; });
    setErro("");
    try { await api.marcarFeitos(ids, feito); }
    catch (e) { setFeitos(antes); setErro((e as Error).message); }
  }, []);

  return { feitos, marcar, erro };
}
