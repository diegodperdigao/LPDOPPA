import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, CircleAlert, Link2, PartyPopper, PenLine, Scale, UserRound } from "lucide-react";
import { BIO_LINK, BIO_TEXTO, DESTAQUES, RODAPE, RODAPE_ITENS, SEGMENTOS } from "../../content";
import { api, type Segmento } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { Phone } from "../../components/Phone";
import { IconTile } from "../../components/Icon";
import { Confetti, CopyButton, Dock } from "../../components/ui";
import Layout, { Cabeca } from "./Layout";

function Guia({ n, titulo, feito, onFeito, children }: { n: number; titulo: string; feito: boolean; onFeito: () => void; children: React.ReactNode }) {
  return (
    <section className={"guide" + (feito ? " done" : "")}>
      <div className="guide__head">
        <div className="guide__num">{feito ? <Check size={16} strokeWidth={2.6} /> : n}</div>
        <b>{titulo}</b>
      </div>
      <div className="guide__body">
        {children}
        <button className={"btn btn--sm " + (feito ? "btn--ghost" : "btn--green")} onClick={onFeito}>
          <Check size={16} strokeWidth={2.4} /> {feito ? "Feito" : "Fiz isso"}
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
  const faltam = ["bio", "legenda", "destaques"].filter((k) => !feitos[k]).length;

  async function seguir() {
    setSalvando(true);
    try {
      const jaTinha = !!conta?.orient_perfil_em;
      await api.marcarEtapa("orient_perfil");
      await recarregar();
      nav("/", { replace: true, state: { liberado: !jaTinha } });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="perfil">
      {festa && <Confetti />}
      {festa && (
        <div className="card card--glow row" style={{ marginBottom: 6 }}>
          <IconTile icon={PartyPopper} tom="green" size={40} />
          <div><b style={{ fontWeight: 600 }}>Perfis vinculados!</b><div className="dim">Agora é só ajustar os perfis e os roteiros liberam.</div></div>
        </div>
      )}
      <Cabeca icone={<IconTile icon={UserRound} size={52} />} titulo="Ajuste seus perfis">
        Perfil bem montado passa confiança e entrega mais.
      </Cabeca>

      <div className="seg-tabs" style={{ marginBottom: 18 }}>
        {(["esp", "cas"] as Segmento[]).map((k) => {
          const S = SEGMENTOS[k];
          return <button key={k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}><S.icon size={16} strokeWidth={1.9} /> {S.curto}</button>;
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }} key={seg} className="ob-body">
        <Phone tela="perfil" usuario={user} nome={s.exemploNome} bio={BIO_TEXTO} link={BIO_LINK} destaques={DESTAQUES} small />
      </div>

      <div className="stack">
        <Guia n={1} titulo="Bio e link (iguais nos 2 perfis)" feito={!!feitos.bio} onFeito={() => marca("bio")}>
          <div className="pro-alert">
            <CircleAlert size={18} color="var(--t-yellow)" style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>Texto <b style={{ display: "inline" }}>e</b> link exatamente assim, nos dois perfis. Senão os vídeos podem não ser validados.</span>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="row dim"><PenLine size={14} /> Editar perfil → Bio</span>
            <div className="copy-box">{BIO_TEXTO}</div>
            <CopyButton texto={BIO_TEXTO} label="Copiar texto da bio" />
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="row dim"><Link2 size={14} /> Editar perfil → Adicionar link</span>
            <div className="copy-box" style={{ color: "var(--t-violet)" }}>{BIO_LINK}</div>
            <CopyButton texto={BIO_LINK} label="Copiar link" />
          </div>
        </Guia>

        <Guia n={2} titulo="Rodapé legal em toda legenda" feito={!!feitos.legenda} onFeito={() => marca("legenda")}>
          <div className="pro-alert">
            <Scale size={18} color="var(--t-yellow)" style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>Vídeo sem o rodapé completo <b style={{ display: "inline" }}>não é contabilizado</b>.</span>
          </div>
          <div className="rodape-itens">{RODAPE_ITENS.map((t) => <span key={t} className="chip chip--green"><Check size={12} strokeWidth={2.6} /> {t}</span>)}</div>
          <div className="copy-box">{RODAPE}</div>
          <CopyButton texto={RODAPE} label="Copiar rodapé" />
          <p className="dim">Dica: salve o rodapé nas notas do celular. Use também a hashtag da marca do roteiro (ex.: #kingpanda, #superbet).</p>
        </Guia>

        <Guia n={3} titulo="Crie os destaques" feito={!!feitos.destaques} onFeito={() => marca("destaques")}>
          <p className="muted" style={{ fontSize: 14 }}>Poste um story pra cada um e salve como destaque:</p>
          <div className="row" style={{ gap: 18 }}>
            {DESTAQUES.map((d) => (
              <div key={d} className="center" style={{ fontSize: 12.5, fontWeight: 500, width: 72 }}>
                <div className="hl-circ" />
                {d}
              </div>
            ))}
          </div>
        </Guia>
      </div>

      <Dock>
        <button className="btn" disabled={faltam > 0 || salvando} onClick={seguir}>
          {faltam ? `Faltam ${faltam} ${faltam === 1 ? "item" : "itens"}` : <>Perfis prontos, liberar roteiros <ArrowRight size={18} /></>}
        </button>
      </Dock>
    </Layout>
  );
}
