import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCAO } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { Dock } from "../../components/ui";
import Layout from "./Layout";

export default function OrientProducao() {
  const { recarregar } = useConta();
  const nav = useNavigate();
  const [vistos, setVistos] = useState<Set<number>>(new Set([0]));
  const [aberto, setAberto] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const tudo = vistos.size === PRODUCAO.length;

  function abrir(i: number) {
    setAberto(i);
    setVistos((v) => new Set(v).add(i));
  }

  async function seguir() {
    setSalvando(true);
    try {
      await api.marcarEtapa("orient_producao");
      await recarregar();
      nav("/", { replace: true, state: { liberado: true } });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="producao">
      <div className="center">
        <div className="hero-ico">🎬</div>
        <h1 className="h-display h1">Como <span className="grad-text">gravar</span></h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>4 dicas pra gravar mais rápido e melhor. Toque em cada uma.</p>
      </div>

      <div className="stack">
        {PRODUCAO.map((d, i) => (
          <section key={d.titulo} className={"guide" + (vistos.has(i) ? " done" : "")}>
            <button className="guide__head" style={{ width: "100%", textAlign: "left" }} onClick={() => abrir(i)} aria-expanded={aberto === i}>
              <div className="guide__num" style={{ fontSize: 20 }}>{vistos.has(i) && aberto !== i ? "✓" : d.icone}</div>
              <b style={{ flex: 1 }}>{d.titulo}</b>
              <span className="muted">{aberto === i ? "▴" : "▾"}</span>
            </button>
            {aberto === i && (
              <div className="guide__body ob-body">
                <ol className="steps-mini">{d.passos.map((p) => <li key={p}>{p}</li>)}</ol>
                {i < PRODUCAO.length - 1 && (
                  <button className="btn btn--sm btn--ghost" style={{ alignSelf: "flex-start" }} onClick={() => abrir(i + 1)}>Próxima dica →</button>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      <Dock>
        <button className="btn btn--green" disabled={!tudo || salvando} onClick={seguir}>
          {tudo ? "Liberar meus roteiros 🔓" : `Veja as ${PRODUCAO.length} dicas (${vistos.size}/${PRODUCAO.length})`}
        </button>
      </Dock>
    </Layout>
  );
}
