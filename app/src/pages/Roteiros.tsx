import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Download, MoonStar, Scale } from "lucide-react";
import { MARCAS, SEGMENTOS } from "../content";
import { api, hojeSP, type Roteiro, type Segmento } from "../lib/api";
import { useConta } from "../lib/conta";
import { igUrl } from "../lib/ig";
import Shell from "../components/Shell";
import { IconTile, InstagramLogo } from "../components/Icon";
import { CopyButton } from "../components/ui";

function Card({ r, perfil, i }: { r: Roteiro; perfil: string | null; i: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <article className="rot" style={{ animation: `rise .45s ${i * 60}ms both` }}>
      <div className="rot__head">
        <span className="chip chip--violet">{r.marca ? MARCAS[r.marca] ?? r.marca : "Roteiro"}</span>
        <span className="dim">#{i + 1}</span>
      </div>
      <div className="rot__title">{r.titulo}</div>
      {r.imagem_url && <img src={r.imagem_url} alt="" loading="lazy" className="rot__img" />}
      <div className={"rot__text" + (aberto ? " open" : "")}>{r.texto}</div>
      <div className="rot__actions">
        <CopyButton texto={r.texto} label="Copiar roteiro" />
        <button className="copy-btn" onClick={() => setAberto(!aberto)}>
          <ChevronDown size={16} style={{ transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> {aberto ? "Recolher" : "Ler tudo"}
        </button>
        {r.imagem_url && <a className="copy-btn" href={r.imagem_url} download target="_blank" rel="noopener"><Download size={16} /> Imagem</a>}
        {perfil && <a className="copy-btn" href={igUrl(perfil)} target="_blank" rel="noopener"><InstagramLogo size={15} /> @{perfil}</a>}
      </div>
    </article>
  );
}

export default function Roteiros() {
  const { conta } = useConta();
  const [seg, setSeg] = useState<Segmento>("esp");
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);

  const lista = (roteiros ?? []).filter((r) => r.segmento === seg && r.publicado);
  const perfil = seg === "esp" ? conta?.ig_esp ?? null : conta?.ig_cas ?? null;
  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

  return (
    <Shell titulo="Roteiros">
      <p className="dim row" style={{ marginBottom: 12, textTransform: "capitalize" }}><CalendarDays size={15} /> {hoje}</p>
      <div className="seg-tabs" style={{ marginBottom: 16, position: "sticky", top: 70, zIndex: 5, background: "var(--bg)" }}>
        {(["esp", "cas"] as Segmento[]).map((k) => {
          const S = SEGMENTOS[k];
          const n = (roteiros ?? []).filter((r) => r.segmento === k && r.publicado).length;
          return <button key={k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}><S.icon size={16} strokeWidth={1.9} /> {S.curto} {roteiros && <span className="count">{n}</span>}</button>;
        })}
      </div>
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
      <div className="lembrete"><Scale size={18} /> <span>Não esquece: <b>rodapé legal</b> em toda legenda e a <b>hashtag da marca</b>.</span></div>
    </Shell>
  );
}
