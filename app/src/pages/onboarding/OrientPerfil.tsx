import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BIO, DESTAQUES, RODAPE, RODAPE_ITENS, SEGMENTOS } from "../../content";
import { api, type Segmento } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { Phone } from "../../components/Phone";
import { Confetti, CopyButton, Dock } from "../../components/ui";
import Layout from "./Layout";

function Guia({ n, titulo, feito, onFeito, children }: { n: number; titulo: string; feito: boolean; onFeito: () => void; children: React.ReactNode }) {
  return (
    <section className={"guide" + (feito ? " done" : "")}>
      <div className="guide__head">
        <div className="guide__num">{feito ? "✓" : n}</div>
        <b>{titulo}</b>
      </div>
      <div className="guide__body">
        {children}
        <button className={"btn btn--sm " + (feito ? "btn--ghost" : "btn--green")} style={{ alignSelf: "flex-start" }} onClick={onFeito}>
          {feito ? "✓ Feito" : "Fiz isso ✓"}
        </button>
      </div>
    </section>
  );
}

export default function OrientPerfil() {
  const { conta, recarregar } = useConta();
  const nav = useNavigate();
  const festa = (useLocation().state as { festa?: boolean } | null)?.festa;
  const [seg, setSeg] = useState<Segmento>("esp");
  const [feitos, setFeitos] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);
  const s = SEGMENTOS[seg];
  const user = (seg === "esp" ? conta?.ig_esp : conta?.ig_cas) || s.exemploUser;
  const marca = (k: string) => setFeitos((f) => ({ ...f, [k]: !f[k] }));
  const tudo = ["bio", "legenda", "destaques"].every((k) => feitos[k]);

  async function seguir() {
    setSalvando(true);
    try {
      const jaTinha = !!conta?.orient_producao_em;
      await api.marcarEtapa("orient_perfil");
      await recarregar();
      nav(jaTinha ? "/" : "/onboarding/producao", { replace: true });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="perfil">
      {festa && <Confetti />}
      {festa && (
        <div className="card card--glow center" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <b style={{ fontSize: 18 }}>Perfis vinculados! Você já é criador Doppa.</b>
          <p className="muted" style={{ fontSize: 14 }}>Agora deixa seus perfis com a cara certa.</p>
        </div>
      )}
      <div className="center">
        <h1 className="h-display h1">Monte seu <span className="grad-text">perfil</span></h1>
        <p className="muted" style={{ margin: "8px 0 16px" }}>Perfil bem montado passa confiança e entrega mais.</p>
      </div>

      <div className="seg-tabs" style={{ marginBottom: 18 }}>
        {(["esp", "cas"] as Segmento[]).map((k) => (
          <button key={k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}>{SEGMENTOS[k].emoji} {SEGMENTOS[k].curto}</button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }} key={seg} className="ob-body">
        <Phone tela="perfil" usuario={user} nome={s.exemploNome} emoji={s.emoji} bio={BIO[seg]} destaques={DESTAQUES} small />
      </div>

      <div className="stack">
        <Guia n={1} titulo="Cole a bio" feito={!!feitos.bio} onFeito={() => marca("bio")}>
          <p className="muted" style={{ fontSize: 14 }}>Editar perfil → Bio. Uma pra cada perfil.</p>
          <div className="copy-box">{BIO[seg]}</div>
          <CopyButton texto={BIO[seg]} label={`Copiar bio de ${s.nome}`} />
        </Guia>

        <Guia n={2} titulo="Rodapé legal em TODA legenda" feito={!!feitos.legenda} onFeito={() => marca("legenda")}>
          <div className="pro-alert" style={{ padding: 12 }}>
            <div className="pro-alert__ico" style={{ flexBasis: 38, height: 38, fontSize: 20 }}>⚖️</div>
            <span>Vídeo sem o rodapé completo <b style={{ display: "inline", color: "var(--yellow)" }}>não é contabilizado</b>.</span>
          </div>
          <div className="rodape-itens">{RODAPE_ITENS.map((t) => <span key={t} className="chip chip--green">✓ {t}</span>)}</div>
          <div className="copy-box">{RODAPE}</div>
          <CopyButton texto={RODAPE} label="Copiar rodapé" />
          <p className="dim">Dica: salve o rodapé nas notas do celular pra colar rapidinho. Use também a hashtag da marca do roteiro (ex.: #kingpanda, #superbet).</p>
        </Guia>

        <Guia n={3} titulo="Crie os destaques" feito={!!feitos.destaques} onFeito={() => marca("destaques")}>
          <p className="muted" style={{ fontSize: 14 }}>Poste um story pra cada um e salve como destaque:</p>
          <div className="row" style={{ gap: 16 }}>
            {DESTAQUES.map((d) => (
              <div key={d.nome} className="center" style={{ fontSize: 13, fontWeight: 600 }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", border: "2px solid var(--line-2)", display: "grid", placeItems: "center", fontSize: 26, marginBottom: 4 }}>{d.emoji}</div>
                {d.nome}
              </div>
            ))}
          </div>
        </Guia>
      </div>

      <Dock>
        <button className="btn" disabled={!tudo || salvando} onClick={seguir}>
          {tudo ? "Perfil pronto! Próximo →" : `Faltam ${3 - ["bio", "legenda", "destaques"].filter((k) => feitos[k]).length} itens`}
        </button>
      </Dock>
    </Layout>
  );
}
