import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Clapperboard, Clock3, Download, Film, Hourglass, Info, ListChecks, Loader2, MoonStar, Newspaper, Timer } from "lucide-react";
import { MARCAS, SEGMENTOS } from "../content";
import { api, hojeSP, type Midia, type Roteiro, type Segmento } from "../lib/api";
import { useConta } from "../lib/conta";
import { igUrl } from "../lib/ig";
import { baixarMidia, baixarZip } from "../lib/baixar";
import Shell from "../components/Shell";
import Portal from "../components/Portal";
import { IconTile, InstagramLogo } from "../components/Icon";
import { CopyButton } from "../components/ui";

const INTRO_KEY = "doppa_rot_intro";

// Explicação que aparece no primeiro acesso (e no botão "Como funciona").
function Intro({ onFechar }: { onFechar: () => void }) {
  const itens = [
    { icon: Clapperboard, tom: "violet" as const, t: "30 roteiros por dia", d: "São vídeos rápidos: dá pra gravar tudo investindo no máximo 2 horas por dia." },
    { icon: Hourglass, tom: "yellow" as const, t: "Prazo: até sair o próximo lote", d: "Os vídeos de um dia valem até os roteiros do dia seguinte serem publicados aqui. Chegaram os novos? O prazo dos anteriores acabou." },
    { icon: Newspaper, tom: "cyan" as const, t: "Esportes e Notícias/Variedades", d: "Cada roteiro diz de qual segmento é: poste no perfil certo e siga as instruções de postagem e a legenda de cada um." },
  ];
  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <div className="modal__sheet stack" role="dialog" aria-modal="true">
          <span className="eyebrow">Antes de começar</span>
          <h2 className="h-display" style={{ fontSize: 30 }}>Como funcionam os roteiros</h2>
          <div className="ico-list">
            {itens.map((x) => (
              <div className="ico-item" key={x.t}><IconTile icon={x.icon} tom={x.tom} size={38} /><div><b>{x.t}</b><span>{x.d}</span></div></div>
            ))}
          </div>
          <button className="btn" onClick={onFechar}>Entendi, bora gravar</button>
        </div>
      </div>
    </Portal>
  );
}

function MidiaItem({ m }: { m: Midia }) {
  const [baixando, setBaixando] = useState(false);
  async function baixar() {
    setBaixando(true);
    try { await baixarMidia(m); } catch (e) { alert((e as Error).message); } finally { setBaixando(false); }
  }
  return (
    <button className="midia" onClick={baixar} disabled={baixando} title={`Baixar ${m.nome}`}>
      {m.tipo === "imagem" ? <img src={m.url} alt="" loading="lazy" /> : <span className="midia__vid"><Film size={22} /></span>}
      <span className="midia__dl">{baixando ? <Loader2 size={15} className="gira" /> : <Download size={15} />}</span>
      <span className="midia__tipo">{m.tipo === "imagem" ? "Imagem" : "Vídeo base"}</span>
    </button>
  );
}

function Card({ r, perfil, i }: { r: Roteiro; perfil: string | null; i: number }) {
  const [aberto, setAberto] = useState(false);
  const [zipando, setZipando] = useState(false);
  const midias = r.midias ?? [];
  async function baixarTudo() {
    setZipando(true);
    try { await baixarZip([{ pasta: r.titulo, midias }], `${String(i + 1).padStart(2, "0")} - ${r.titulo}.zip`); }
    catch (e) { alert((e as Error).message); } finally { setZipando(false); }
  }
  return (
    <article className="rot" style={{ animation: `rise .45s ${Math.min(i, 8) * 50}ms both` }}>
      <div className="rot__head">
        <span className="chip chip--violet">{r.marca ? MARCAS[r.marca] ?? r.marca : "Roteiro"}</span>
        <span className="dim">#{i + 1}</span>
      </div>
      <div className="rot__title">{r.titulo}</div>
      {r.instrucoes && <div className="rot__inst"><Info size={16} /><span>{r.instrucoes}</span></div>}
      <div className={"rot__text" + (aberto ? " open" : "")}>{r.texto}</div>
      <div className="rot__actions">
        <CopyButton texto={r.texto} label="Copiar roteiro" />
        <button className="copy-btn" onClick={() => setAberto(!aberto)}>
          <ChevronDown size={16} style={{ transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> {aberto ? "Recolher" : "Ler tudo"}
        </button>
      </div>

      {midias.length > 0 && (
        <div className="rot__bloco">
          <div className="rot__bloco-t">
            <span>Arquivos pro vídeo <span className="count">{midias.length}</span></span>
            {midias.length > 1 && <button className="link-btn" style={{ padding: 0 }} onClick={baixarTudo} disabled={zipando}>{zipando ? <Loader2 size={14} className="gira" /> : <Download size={14} />} Baixar todos</button>}
          </div>
          <div className="midias">{midias.map((m) => <MidiaItem key={m.url} m={m} />)}</div>
        </div>
      )}

      {r.legenda && (
        <div className="rot__bloco">
          <div className="rot__bloco-t"><span>Legenda</span></div>
          <div className="copy-box" style={{ fontSize: 13.5 }}>{r.legenda}</div>
          <CopyButton texto={r.legenda} label="Copiar legenda" />
        </div>
      )}

      {perfil && <a className="rot__perfil" href={igUrl(perfil)} target="_blank" rel="noopener"><InstagramLogo size={15} /> Postar em @{perfil}</a>}
    </article>
  );
}

export default function Roteiros() {
  const { conta } = useConta();
  const [seg, setSeg] = useState<Segmento>("esp");
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [intro, setIntro] = useState(() => { try { return localStorage.getItem(INTRO_KEY) !== "1"; } catch { return false; } });
  const [zip, setZip] = useState<string | null>(null);

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);
  function fecharIntro() { setIntro(false); try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* sem storage */ } }

  const lista = (roteiros ?? []).filter((r) => r.segmento === seg && r.publicado);
  const perfil = seg === "esp" ? conta?.ig_esp ?? null : conta?.ig_cas ?? null;
  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());
  const totalMidias = lista.reduce((n, r) => n + (r.midias?.length ?? 0), 0);

  async function baixarDia() {
    setZip("0");
    try {
      await baixarZip(
        lista.filter((r) => r.midias?.length).map((r) => ({ pasta: `${String(lista.indexOf(r) + 1).padStart(2, "0")} - ${r.titulo}`, midias: r.midias })),
        `Roteiros ${SEGMENTOS[seg].curto} ${hojeSP()}.zip`,
        (f, t) => setZip(`${f}/${t}`),
      );
    } catch (e) { alert((e as Error).message); } finally { setZip(null); }
  }

  return (
    <Shell titulo="Roteiros" acao={<button className="icon-btn" onClick={() => setIntro(true)} aria-label="Como funcionam os roteiros"><ListChecks size={18} /></button>}>
      <p className="dim row" style={{ marginBottom: 12, textTransform: "capitalize" }}><CalendarDays size={15} /> {hoje}</p>
      <div className="seg-tabs" style={{ marginBottom: 12, position: "sticky", top: 70, zIndex: 5, background: "var(--bg)" }}>
        {(["esp", "cas"] as Segmento[]).map((k) => {
          const S = SEGMENTOS[k];
          const n = (roteiros ?? []).filter((r) => r.segmento === k && r.publicado).length;
          return <button key={k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}><S.icon size={16} strokeWidth={1.9} /> {S.curto} {roteiros && <span className="count">{n}</span>}</button>;
        })}
      </div>

      {totalMidias > 0 && (
        <button className="baixar-dia" onClick={baixarDia} disabled={!!zip}>
          <IconTile icon={zip ? Timer : Download} tom="green" size={38} />
          <span style={{ flex: 1 }}><b>{zip ? `Preparando… ${zip === "0" ? "" : zip}` : `Baixar todos os arquivos de ${SEGMENTOS[seg].curto}`}</b><span>{totalMidias} arquivos (imagens e vídeos base) num .zip, separados por roteiro</span></span>
        </button>
      )}

      <div className="rot-grid">
        {roteiros === null && [0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 180, borderRadius: 18 }} />)}
        {roteiros !== null && lista.length === 0 && (
          <div className="empty" style={{ gridColumn: "1 / -1" }}>
            <IconTile icon={MoonStar} tom="neutral" size={52} />
            Os roteiros de {SEGMENTOS[seg].curto} ainda não saíram hoje.<br />A gente avisa no grupo assim que chegarem.
          </div>
        )}
        {lista.map((r, i) => <Card key={r.id} r={r} perfil={perfil} i={i} />)}
      </div>
      <div className="lembrete"><Clock3 size={18} /> <span>Prazo: os vídeos de hoje valem <b>até os roteiros de amanhã saírem</b>.</span></div>
      {intro && <Intro onFechar={fecharIntro} />}
    </Shell>
  );
}
