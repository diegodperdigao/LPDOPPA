import { useEffect } from "react";
import { ArrowRight, BellOff } from "lucide-react";
import { useAvisos } from "../lib/avisos";
import Shell from "../components/Shell";
import { IconTile } from "../components/Icon";
import { TONS, useAbrirCta } from "../components/Avisos";

const quando = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? "hoje" : d === 1 ? "ontem" : `há ${d} dias`;
};

export default function Mural() {
  const { avisos, marcar } = useAvisos();
  const abrir = useAbrirCta();

  // Abriu o mural: tudo que aparece aqui conta como visto (menos pop-ups, que se fecham sozinhos).
  useEffect(() => {
    const t = setTimeout(() => avisos.filter((a) => !a.lido && a.tipo !== "popup").forEach((a) => marcar(a.id)), 1500);
    return () => clearTimeout(t);
  }, [avisos, marcar]);

  return (
    <Shell titulo="Avisos">
      <div className="stack">
        {avisos.length === 0 && <div className="empty"><IconTile icon={BellOff} tom="neutral" size={52} />Nenhum aviso por enquanto.</div>}
        {avisos.map((a, i) => {
          const t = TONS[a.tom];
          return (
            <article key={a.id} className={"mural-i" + (a.lido ? "" : " novo")} style={{ animation: `rise .4s ${i * 50}ms both` }}>
              <IconTile icon={t.icon} tom={t.tom} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{a.titulo}</b>
                {a.corpo && <p>{a.corpo}</p>}
                {a.cta_texto && a.cta_url && <button className="faixa__cta" onClick={() => abrir(a)}>{a.cta_texto} <ArrowRight size={14} /></button>}
                <span className="dim">{t.rot} · {quando(a.inicio)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
