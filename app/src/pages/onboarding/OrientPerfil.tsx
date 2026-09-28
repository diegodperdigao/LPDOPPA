import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, CircleAlert, Download, ImageIcon, Link2, PartyPopper, PenLine, UserRound } from "lucide-react";
import { BIO_LINK, BIO_TEXTO, DESTAQUE, SEGMENTOS } from "../../content";
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
  const faltam = ["bio", "destaques"].filter((k) => !feitos[k]).length;

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
        <Phone tela="perfil" usuario={user} nome={s.exemploNome} bio={BIO_TEXTO} link={BIO_LINK} destaques={[DESTAQUE]} small />
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

        <Guia n={2} titulo={`Crie o destaque ${DESTAQUE.nome}`} feito={!!feitos.destaques} onFeito={() => marca("destaques")}>
          <p className="muted" style={{ fontSize: 14 }}>Nos dois perfis. É o único destaque que o perfil precisa ter.</p>
          <div className="destaque">
            <div className="destaque__capa" style={DESTAQUE.imagem ? { backgroundImage: `url(${DESTAQUE.imagem})` } : undefined}>{!DESTAQUE.imagem && <ImageIcon size={22} />}</div>
            <ol className="steps-mini">
              <li><span>Baixe a imagem e poste como <b>story</b></span></li>
              <li><span>No story, adicione a figurinha de <b>link</b> com o link abaixo</span></li>
              <li><span>Salve nos destaques com o nome <b>{DESTAQUE.nome}</b></span></li>
            </ol>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {DESTAQUE.imagem
              ? <a className="copy-btn" href={DESTAQUE.imagem} download><Download size={15} /> Baixar imagem do destaque</a>
              : <span className="copy-btn" aria-disabled="true" style={{ opacity: .55 }}><Download size={15} /> Imagem do destaque em breve</span>}
            {DESTAQUE.link ? (
              <>
                <div className="copy-box" style={{ color: "var(--t-violet)" }}>{DESTAQUE.link}</div>
                <CopyButton texto={DESTAQUE.link} label="Copiar link do destaque" />
              </>
            ) : <span className="dim" style={{ fontSize: 13 }}>O link do destaque aparece aqui em breve.</span>}
          </div>
        </Guia>
      </div>

      <Dock>
        <button className="btn" disabled={faltam > 0 || salvando} onClick={seguir}>
          {faltam ? `Faltam ${faltam} ${faltam === 1 ? "item" : "itens"}` : <>Perfis prontos, continuar <ArrowRight size={18} /></>}
        </button>
      </Dock>
    </Layout>
  );
}
