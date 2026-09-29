import { useEffect, useState } from "react";
import { CalendarDays, Check, CheckCheck, ChevronDown, X, ExternalLink, LayoutList, Mic, Clapperboard, Clock3, Download, Film, Hourglass, Info, ListChecks, Loader2, MoonStar, Newspaper, Timer } from "lucide-react";
import { MARCAS, SEGMENTOS } from "../content";
import { api, hojeSP, type Midia, type Roteiro, type Segmento } from "../lib/api";
import { useConta } from "../lib/conta";
import { useFeitos } from "../lib/feitos";
import { igUrl } from "../lib/ig";
import { baixarMidia, baixarZip } from "../lib/baixar";
import Shell from "../components/Shell";
import Portal from "../components/Portal";
import { IconTile, InstagramLogo } from "../components/Icon";
import { CopyButton } from "../components/ui";

const INTRO_KEY = "doppa_rot_intro";
const MODO_KEY = "doppa_rot_modo";

// Explicação no topo da página no primeiro acesso (some com "Entendi"; o botão do topo mostra de novo).
function Intro({ onFechar }: { onFechar: () => void }) {
  const itens = [
    { icon: Clapperboard, tom: "violet" as const, t: "30 roteiros por dia", d: "Vídeos rápidos: dá pra gravar tudo em até 2 horas." },
    { icon: Hourglass, tom: "yellow" as const, t: "Prazo: até sair o próximo lote", d: "Vale até os roteiros do dia seguinte serem publicados aqui." },
    { icon: Newspaper, tom: "cyan" as const, t: "Cada um no seu perfil", d: "Siga a instrução de postagem e a legenda de cada roteiro." },
  ];
  return (
    <section className="rot-intro">
      <div className="rot-intro__t"><b>Como funcionam os roteiros</b><button className="icon-btn" onClick={onFechar} aria-label="Fechar explicação"><X size={16} /></button></div>
      <div className="rot-intro__itens">
        {itens.map((x) => (
          <div key={x.t}><IconTile icon={x.icon} tom={x.tom} size={32} /><span><b>{x.t}</b><span>{x.d}</span></span></div>
        ))}
      </div>
      <button className="btn btn--sm" onClick={onFechar}>Entendi</button>
    </section>
  );
}

// Arquivo que ficou no Drive (maior que o limite do Storage): abre o link em vez de baixar.
const externo = (m: Midia) => /^https:\/\/(drive|docs)\.google\.com\//.test(m.url);

function MidiaItem({ m }: { m: Midia }) {
  const [baixando, setBaixando] = useState(false);
  if (externo(m)) {
    return (
      <a className="midia midia--link" href={m.url} target="_blank" rel="noopener" title={`Abrir ${m.nome} no Drive`}>
        <span className="midia__vid"><Film size={22} /></span>
        <span className="midia__dl"><ExternalLink size={14} /></span>
        <span className="midia__tipo">{m.rotulo ?? "Vídeo base"} · Drive</span>
      </a>
    );
  }
  async function baixar() {
    setBaixando(true);
    try { await baixarMidia(m); } catch (e) { alert((e as Error).message); } finally { setBaixando(false); }
  }
  return (
    <button className="midia" onClick={baixar} disabled={baixando} title={`Baixar ${m.nome}`}>
      {m.tipo === "imagem" ? <img src={m.url} alt="" loading="lazy" /> : <span className="midia__vid"><Film size={22} /></span>}
      <span className="midia__dl">{baixando ? <Loader2 size={15} className="gira" /> : <Download size={15} />}</span>
      <span className="midia__tipo">{m.rotulo ?? (m.tipo === "imagem" ? "Imagem" : "Vídeo base")}</span>
    </button>
  );
}

const TIPO_CHIP: Record<Roteiro["tipo"], { rot: string; cls: string } | null> = {
  roteiro: null,
  react: { rot: "React", cls: "chip--cyan" },
  fofoca: { rot: "Fofoca · 2 imagens", cls: "chip--pink" },
};
const MARCADOR_CARD = /^card a partir daqui\.?$/im;

// Texto do roteiro com o ponto do card da fofoca destacado.
function TextoRoteiro({ texto }: { texto: string }) {
  const partes = texto.split(MARCADOR_CARD);
  if (partes.length < 2) return <>{texto}</>;
  return <>{partes[0].trim()}<span className="rot__card">Card a partir daqui</span>{partes.slice(1).join("").trim()}</>;
}

// Botão de check grande (área de toque de 44px).
function BotaoFeito({ feito, onClick, rotulo }: { feito: boolean; onClick: () => void; rotulo: string }) {
  return (
    <button className={"feito-btn" + (feito ? " on" : "")} onClick={onClick} aria-pressed={feito} aria-label={rotulo}>
      <Check size={18} strokeWidth={3} />
    </button>
  );
}

function Card({ r, perfil, i, n, feito, onFeito }: { r: Roteiro; perfil: string | null; i: number; n: number; feito: boolean; onFeito: () => void }) {
  const [expandido, setExpandido] = useState(false);
  if (feito && !expandido) {
    return (
      <article className="rot rot--feito">
        <BotaoFeito feito onClick={onFeito} rotulo={`Desmarcar roteiro ${n}`} />
        <button className="rot--feito__t" onClick={() => setExpandido(true)}>
          <span className="dim">#{n}</span> <b>{r.titulo}</b>
        </button>
        <span className="chip chip--green">Feito</span>
      </article>
    );
  }
  return <CardCompleto r={r} perfil={perfil} i={i} n={n} feito={feito} onFeito={onFeito} />;
}

function CardCompleto({ r, perfil, i, n, feito, onFeito }: { r: Roteiro; perfil: string | null; i: number; n: number; feito: boolean; onFeito: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [instAberta, setInstAberta] = useState(false);
  const [zipando, setZipando] = useState(false);
  const midias = r.midias ?? [];
  const numero = n;
  const tipo = TIPO_CHIP[r.tipo ?? "roteiro"];
  const instLonga = (r.instrucoes?.length ?? 0) > 220;
  async function baixarTudo() {
    setZipando(true);
    try { await baixarZip([{ pasta: r.titulo, midias }], `${String(numero).padStart(2, "0")} - ${r.titulo}.zip`); }
    catch (e) { alert((e as Error).message); } finally { setZipando(false); }
  }
  return (
    <article className="rot" style={{ animation: `rise .45s ${Math.min(i, 8) * 50}ms both` }}>
      <div className="rot__head">
        <span className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="chip chip--violet">{r.marca ? MARCAS[r.marca] ?? r.marca : "Roteiro"}</span>
          {tipo && <span className={"chip " + tipo.cls}>{tipo.rot}</span>}
        </span>
        <span className="row" style={{ gap: 10 }}>
          <span className="dim">#{numero}</span>
          <BotaoFeito feito={feito} onClick={onFeito} rotulo={feito ? `Desmarcar roteiro ${numero}` : `Marcar roteiro ${numero} como feito`} />
        </span>
      </div>
      <div className="rot__title">{r.titulo}</div>
      {r.creditos && <div className="rot__cred">{r.creditos}</div>}
      {r.instrucoes && (
        <div className="rot__inst">
          <Info size={16} />
          <div>
            <span className={instLonga && !instAberta ? "clamp" : ""}>{r.instrucoes}</span>
            {instLonga && <button className="link-btn" style={{ padding: 0, fontSize: 12.5 }} onClick={() => setInstAberta(!instAberta)}>{instAberta ? "Ver menos" : "Ver instruções completas"}</button>}
          </div>
        </div>
      )}
      {r.texto.trim() && (
        <>
          <div className={"rot__text" + (aberto ? " open" : "")}><TextoRoteiro texto={r.texto} /></div>
          {r.pronuncia && <div className="rot__pron"><Mic size={14} /> <span><b>Pronúncia:</b> {r.pronuncia}</span></div>}
          <div className="rot__actions">
            <CopyButton texto={r.texto.replace(MARCADOR_CARD, "").replace(/\n{3,}/g, "\n\n")} label="Copiar roteiro" />
            <button className="copy-btn" onClick={() => setAberto(!aberto)}>
              <ChevronDown size={16} style={{ transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> {aberto ? "Recolher" : "Ler tudo"}
            </button>
          </div>
        </>
      )}

      {midias.length > 0 && (
        <div className="rot__bloco">
          <div className="rot__bloco-t">
            <span>{r.tipo === "react" ? "Vídeo base" : "Arquivos pro vídeo"} <span className="count">{midias.length}</span></span>
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

// Um bloco por conta, na ordem do Doc (1…24 Esportes, 25…30 Notícias/Variedades).
type Bloco = { seg: Segmento; itens: Roteiro[] };
function blocos(lista: Roteiro[]): Bloco[] {
  const out: Bloco[] = [];
  for (const r of lista) {
    const ult = out[out.length - 1];
    if (ult && ult.seg === r.segmento) ult.itens.push(r); else out.push({ seg: r.segmento, itens: [r] });
  }
  return out;
}

export default function Roteiros() {
  const { conta } = useConta();
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [intro, setIntro] = useState(() => { try { return localStorage.getItem(INTRO_KEY) !== "1"; } catch { return false; } });
  const [zip, setZip] = useState<string | null>(null);
  const [modo, setModoEstado] = useState<"completo" | "checklist">(() => { try { return localStorage.getItem(MODO_KEY) === "checklist" ? "checklist" : "completo"; } catch { return "completo"; } });
  const [desfazer, setDesfazer] = useState<{ ids: string[]; feito: boolean; msg: string } | null>(null);
  const setModo = (m: "completo" | "checklist") => { setModoEstado(m); try { localStorage.setItem(MODO_KEY, m); } catch { /* sem storage */ } };

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);
  function fecharIntro() { setIntro(false); try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* sem storage */ } }

  const lista = (roteiros ?? []).filter((r) => r.publicado).sort((a, b) => (a.ordem || 999) - (b.ordem || 999) || a.segmento.localeCompare(b.segmento));
  const numero = (r: Roteiro) => (r.ordem > 0 ? r.ordem : lista.indexOf(r) + 1);
  const perfilDe = (s: Segmento) => (s === "esp" ? conta?.ig_esp : conta?.ig_cas) ?? null;
  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());
  const totalMidias = lista.reduce((n, r) => n + (r.midias?.length ?? 0), 0);
  const grupos = blocos(lista);
  const { feitos, marcar, erro: erroFeito } = useFeitos(lista.length ? lista : null);
  const nFeitos = lista.filter((r) => feitos.has(r.id)).length;

  function alternar(r: Roteiro) { marcar([r.id], !feitos.has(r.id)); }
  function marcarBloco(g: Bloco) {
    const faltam = g.itens.filter((r) => !feitos.has(r.id)).map((r) => r.id);
    const feito = faltam.length > 0;
    const ids = feito ? faltam : g.itens.map((r) => r.id);
    marcar(ids, feito);
    setDesfazer({ ids, feito, msg: `${ids.length} ${feito ? "marcados como feitos" : "desmarcados"}` });
  }
  useEffect(() => { if (!desfazer) return; const t = setTimeout(() => setDesfazer(null), 6000); return () => clearTimeout(t); }, [desfazer]);

  async function baixarDia() {
    setZip("0");
    try {
      await baixarZip(
        lista.filter((r) => r.midias?.length).map((r) => ({ pasta: `${String(numero(r)).padStart(2, "0")} - ${r.titulo}`, midias: r.midias })),
        `Roteiros ${hojeSP()}.zip`,
        (f, t) => setZip(`${f}/${t}`),
      );
    } catch (e) { alert((e as Error).message); } finally { setZip(null); }
  }

  return (
    <Shell titulo="Roteiros" acao={<button className="icon-btn" onClick={() => setIntro(true)} aria-label="Como funcionam os roteiros"><ListChecks size={18} /></button>}>
      <div className="rot-lista">
        <p className="dim row" style={{ textTransform: "capitalize" }}><CalendarDays size={15} /> {hoje}</p>
        {intro && <Intro onFechar={fecharIntro} />}

        {lista.length > 0 && (
          <div className="rot-prog">
            <div className="rot-prog__top">
              <span><b>{nFeitos}</b> de {lista.length} feitos</span>
              <div className="seg-mini" role="tablist" aria-label="Modo de visualização">
                <button role="tab" aria-selected={modo === "completo"} className={modo === "completo" ? "on" : ""} onClick={() => setModo("completo")}><LayoutList size={15} /> Completo</button>
                <button role="tab" aria-selected={modo === "checklist"} className={modo === "checklist" ? "on" : ""} onClick={() => setModo("checklist")}><ListChecks size={15} /> Checklist</button>
              </div>
            </div>
            <div className="rot-prog__bar"><i style={{ width: `${(nFeitos / lista.length) * 100}%` }} /></div>
            {erroFeito && <span className="alert" style={{ padding: "8px 12px", fontSize: 13 }}>{erroFeito}</span>}
          </div>
        )}

        {lista.length > 0 && (
          <div className="rot-indice">
            {grupos.map((g, k) => {
              const S = SEGMENTOS[g.seg];
              return (
                <a key={k} href={`#bloco-${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(`bloco-${k}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                  <S.icon size={15} /> {S.curto} <b>{numero(g.itens[0])}–{numero(g.itens[g.itens.length - 1])}</b>
                </a>
              );
            })}
          </div>
        )}

        {totalMidias > 0 && (
          <button className="baixar-dia" onClick={baixarDia} disabled={!!zip}>
            <IconTile icon={zip ? Timer : Download} tom="green" size={38} />
            <span style={{ flex: 1 }}><b>{zip ? `Preparando… ${zip === "0" ? "" : zip}` : "Baixar todos os arquivos do dia"}</b><span>{totalMidias} arquivos (imagens e vídeos base) num .zip, uma pasta por roteiro</span></span>
          </button>
        )}

        {roteiros === null && [0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 180, borderRadius: 18 }} />)}
        {roteiros !== null && lista.length === 0 && (
          <div className="empty">
            <IconTile icon={MoonStar} tom="neutral" size={52} />
            Os roteiros de hoje ainda não saíram.<br />A gente avisa no grupo assim que chegarem.
          </div>
        )}

        {grupos.map((g, k) => {
          const S = SEGMENTOS[g.seg];
          const perfil = perfilDe(g.seg);
          return (
            <section key={k} id={`bloco-${k}`} className="rot-bloco">
              <div className={"rot-divisor" + (k > 0 ? " troca" : "")}>
                <IconTile icon={S.icon} tom={S.tom} size={36} />
                <span>
                  <b>{k > 0 ? `A partir daqui: conta de ${S.nome}` : `Conta de ${S.nome}`}</b>
                  <span>{g.itens.filter((r) => feitos.has(r.id)).length}/{g.itens.length} feitos{perfil ? <> · poste em <b>@{perfil}</b></> : ""}</span>
                </span>
              </div>
              {modo === "checklist" ? (
                <div className="checklist">
                  <button className="check-todos" onClick={() => marcarBloco(g)}>
                    <CheckCheck size={17} /> {g.itens.every((r) => feitos.has(r.id)) ? `Desmarcar todos de ${S.curto}` : `Marcar todos de ${S.curto} (${g.itens.filter((r) => !feitos.has(r.id)).length})`}
                  </button>
                  {g.itens.map((r) => {
                    const on = feitos.has(r.id);
                    return (
                      <button key={r.id} className={"check-row" + (on ? " on" : "")} onClick={() => alternar(r)} aria-pressed={on}>
                        <span className="check-row__box"><Check size={17} strokeWidth={3} /></span>
                        <span className="check-row__n">{numero(r)}</span>
                        <span className="check-row__t">{r.titulo}</span>
                        {r.tipo !== "roteiro" && <span className={"chip " + (r.tipo === "react" ? "chip--cyan" : "chip--pink")}>{r.tipo === "react" ? "React" : "Fofoca"}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : g.itens.map((r, i) => <Card key={r.id} r={r} perfil={perfil} i={i} n={numero(r)} feito={feitos.has(r.id)} onFeito={() => alternar(r)} />)}
            </section>
          );
        })}
        <div className="lembrete"><Clock3 size={18} /> <span>Prazo: os vídeos de hoje valem <b>até os roteiros de amanhã saírem</b>.</span></div>
      </div>
      {desfazer && (
        <Portal>
          <div className="toast" role="status">
            <span>{desfazer.msg}</span>
            <button className="link-btn" onClick={() => { marcar(desfazer.ids, !desfazer.feito); setDesfazer(null); }}>Desfazer</button>
          </div>
        </Portal>
      )}
    </Shell>
  );
}
