import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Clapperboard } from "lucide-react";
import { PRODUCAO } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout, { Cabeca } from "./Layout";

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
      nav("/", { replace: true });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="gravar">
      <Cabeca icone={<IconTile icon={Clapperboard} size={52} />} titulo="Como gravar">
        {PRODUCAO.length} dicas pra gravar mais rápido e melhor. Toque em cada uma.
      </Cabeca>

      <div className="stack">
        {PRODUCAO.map((d, i) => {
          const visto = vistos.has(i) && aberto !== i;
          return (
            <section key={d.titulo} className={"guide" + (vistos.has(i) ? " done" : "")}>
              <button className="guide__head" onClick={() => abrir(i)} aria-expanded={aberto === i}>
                {visto ? <span className="guide__num"><Check size={16} strokeWidth={2.6} /></span> : <IconTile icon={d.icon} size={30} />}
                <b>{d.titulo}</b>
                <ChevronDown size={18} style={{ transform: aberto === i ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {aberto === i && (
                <div className="guide__body ob-body">
                  <ol className="steps-mini">{d.passos.map((p) => <li key={p}>{p}</li>)}</ol>
                  {i < PRODUCAO.length - 1 && (
                    <button className="btn btn--sm btn--ghost" onClick={() => abrir(i + 1)}>Próxima dica</button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Dock>
        <button className="btn" disabled={!tudo || salvando} onClick={seguir}>
          {tudo ? <><Check size={18} /> Concluir missão</> : `Veja as ${PRODUCAO.length} dicas (${vistos.size}/${PRODUCAO.length})`}
        </button>
      </Dock>
    </Layout>
  );
}
