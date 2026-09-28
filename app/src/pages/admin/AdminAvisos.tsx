import { useEffect, useState } from "react";
import { Check, Eye, LayoutPanelTop, Megaphone, MousePointerClick, Newspaper, Pencil, Plus, SquareStack, Trash2, Users, X } from "lucide-react";
import { api, ErroApp, type AvisoAdmin, type AvisoNovo, type PublicoAviso, type TipoAviso, type TomAviso } from "../../lib/api";
import { useAvisos } from "../../lib/avisos";
import { WHATSAPP_SUPORTE } from "../../content";
import Shell from "../../components/Shell";
import Portal from "../../components/Portal";
import { IconTile } from "../../components/Icon";
import { CartaoFaixa, CartaoPopup, TONS } from "../../components/Avisos";

const TIPOS: { k: TipoAviso; rot: string; desc: string; icon: typeof Megaphone }[] = [
  { k: "popup", rot: "Pop-up", desc: "Abre na tela assim que a pessoa entra. Pra coisas importantes.", icon: SquareStack },
  { k: "faixa", rot: "Faixa", desc: "Fica no topo das páginas até a pessoa dispensar.", icon: LayoutPanelTop },
  { k: "mural", rot: "Só no mural", desc: "Aparece no sino, sem interromper.", icon: Newspaper },
];
const PUBLICOS: { k: PublicoAviso; rot: string }[] = [
  { k: "todos", rot: "Todos" },
  { k: "sem_termo", rot: "Sem termo assinado" },
  { k: "onboarding", rot: "Ainda no onboarding" },
  { k: "sem_video_7d", rot: "Sem vídeo há 7 dias" },
];
const ATALHOS = [
  { rot: "Roteiros", url: "/roteiros" }, { rot: "Campanha", url: "/campanha" }, { rot: "Carteira", url: "/carteira" }, { rot: "Aprender", url: "/aprender" },
  { rot: "Grupo", url: "/comunidade" }, { rot: "Suporte", url: WHATSAPP_SUPORTE },
];

const local = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
const vazio = (): AvisoNovo => ({ titulo: "", corpo: "", tipo: "popup", tom: "info", publico: "todos", cta_texto: null, cta_url: null, inicio: new Date().toISOString(), fim: null, ativo: true });

function situacao(a: AvisoAdmin) {
  const agora = Date.now();
  if (!a.ativo) return { rot: "Pausado", chip: "" };
  if (new Date(a.inicio).getTime() > agora) return { rot: "Agendado", chip: "chip--violet" };
  if (a.fim && new Date(a.fim).getTime() <= agora) return { rot: "Encerrado", chip: "" };
  return { rot: "No ar", chip: "chip--green" };
}

function Editor({ inicial, onFechar, onSalvo }: { inicial: AvisoNovo; onFechar: () => void; onSalvo: () => void }) {
  const [a, setA] = useState<AvisoNovo>(inicial);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof AvisoNovo>(k: K, v: AvisoNovo[K]) => setA((x) => ({ ...x, [k]: v }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setSalvando(true);
    try {
      await api.salvarAviso({ ...a, cta_texto: a.cta_texto?.trim() || null, cta_url: a.cta_url?.trim() || null });
      onSalvo();
    } catch (x) { setErro(x instanceof ErroApp ? x.message : "Não deu pra salvar."); } finally { setSalvando(false); }
  }

  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <form className="modal__sheet stack aviso-editor" onSubmit={salvar} role="dialog" aria-modal="true">
          <div className="row between">
            <h2 style={{ fontSize: 19, fontWeight: 700 }}>{a.id ? "Editar aviso" : "Novo aviso"}</h2>
            <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
          </div>

          <div className="field"><label>Como aparece</label>
            <div className="tipo-opts">
              {TIPOS.map((t) => (
                <button type="button" key={t.k} className={a.tipo === t.k ? "on" : ""} onClick={() => set("tipo", t.k)}>
                  <t.icon size={20} strokeWidth={1.8} /><b>{t.rot}</b><span>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field"><label>Tom</label>
            <div className="pills">
              {(Object.keys(TONS) as TomAviso[]).map((k) => {
                const T = TONS[k];
                return <button type="button" key={k} className={"pill-opt" + (a.tom === k ? " on" : "")} onClick={() => set("tom", k)}><T.icon size={15} style={{ marginRight: 6, verticalAlign: -2 }} />{T.rot}</button>;
              })}
            </div>
          </div>

          <div className="field"><label>Título</label>
            <div className="input-wrap"><input required maxLength={80} value={a.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Ciclo 4 começou!" /></div></div>
          <div className="field"><label>Mensagem</label>
            <textarea className="textarea" style={{ minHeight: 110 }} maxLength={600} value={a.corpo} onChange={(e) => set("corpo", e.target.value)} placeholder="O que você quer que eles saibam?" /></div>

          <div className="field"><label>Botão (opcional)</label>
            <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="input-wrap"><input value={a.cta_texto ?? ""} onChange={(e) => set("cta_texto", e.target.value)} placeholder="Texto do botão" /></div>
              <div className="input-wrap"><input value={a.cta_url ?? ""} onChange={(e) => set("cta_url", e.target.value)} placeholder="Link ou /pagina" /></div>
            </div>
            <div className="pills">{ATALHOS.map((x) => (
              <button type="button" key={x.url} className={"pill-opt" + (a.cta_url === x.url ? " on" : "")} onClick={() => setA((v) => ({ ...v, cta_url: x.url, cta_texto: v.cta_texto || `Abrir ${x.rot}` }))}>{x.rot}</button>
            ))}</div>
          </div>

          <div className="field"><label>Pra quem</label>
            <div className="pills">{PUBLICOS.map((p) => (
              <button type="button" key={p.k} className={"pill-opt" + (a.publico === p.k ? " on" : "")} onClick={() => set("publico", p.k)}>{p.rot}</button>
            ))}</div>
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field"><label>Começa</label>
              <div className="input-wrap"><input type="datetime-local" value={local(a.inicio)} onChange={(e) => set("inicio", e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())} /></div></div>
            <div className="field"><label>Termina <span className="dim">(opcional)</span></label>
              <div className="input-wrap"><input type="datetime-local" value={local(a.fim)} onChange={(e) => set("fim", e.target.value ? new Date(e.target.value).toISOString() : null)} /></div></div>
          </div>

          <div className="field"><label><Eye size={15} /> Prévia</label>
            <div className="previa">
              {a.tipo === "popup" && <div className="previa__pop"><CartaoPopup a={a} /></div>}
              {a.tipo === "faixa" && <CartaoFaixa a={a} onFechar={() => {}} />}
              {a.tipo === "mural" && <div className="mural-i novo"><IconTile icon={TONS[a.tom].icon} tom={TONS[a.tom].tom} size={40} /><div><b>{a.titulo || "Título do aviso"}</b>{a.corpo && <p>{a.corpo}</p>}</div></div>}
            </div>
          </div>

          <button type="button" className={"check" + (a.ativo ? " on" : "")} onClick={() => set("ativo", !a.ativo)}>
            <span className="check__box"><Check size={15} strokeWidth={3} /></span><span>Publicado (desmarque pra pausar)</span>
          </button>
          {erro && <div className="alert">{erro}</div>}
          <button className="btn" disabled={salvando || !a.titulo.trim()}>{salvando ? "Salvando…" : a.id ? "Salvar alterações" : "Publicar aviso"}</button>
        </form>
      </div>
    </Portal>
  );
}

export default function AdminAvisos() {
  const [lista, setLista] = useState<AvisoAdmin[] | null>(null);
  const [editando, setEditando] = useState<AvisoNovo | null>(null);
  const [erro, setErro] = useState("");
  const { recarregar } = useAvisos();

  const carregar = () => { api.adminAvisos().then(setLista).catch((e) => { setErro(e.message); setLista([]); }); recarregar(); };
  useEffect(carregar, []);

  async function excluir(a: AvisoAdmin) {
    if (!confirm(`Excluir o aviso "${a.titulo}"?`)) return;
    try { await api.excluirAviso(a.id); carregar(); } catch (e) { setErro((e as Error).message); }
  }

  return (
    <Shell titulo="Avisos" acao={<button className="btn btn--sm" onClick={() => setEditando(vazio())}><Plus size={17} /> Novo</button>}>
      {erro && <div className="alert">{erro}</div>}
      <div className="adm-grid">
        {lista === null && [0, 1].map((i) => <div key={i} className="skel" style={{ height: 140, borderRadius: 18 }} />)}
        {lista?.length === 0 && <div className="empty" style={{ gridColumn: "1 / -1" }}><IconTile icon={Megaphone} tom="violet" size={52} />Nenhum aviso ainda. Crie o primeiro no botão “Novo”.</div>}
        {lista?.map((a) => {
          const T = TONS[a.tom], st = situacao(a), tipo = TIPOS.find((t) => t.k === a.tipo)!;
          const pct = a.alcance ? Math.round((a.vistos / a.alcance) * 100) : 0;
          return (
            <article key={a.id} className="pessoa">
              <div className="pessoa__top">
                <IconTile icon={T.icon} tom={T.tom} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}><b>{a.titulo}</b><span>{tipo.rot} · {PUBLICOS.find((p) => p.k === a.publico)?.rot}</span></div>
                <span className={"chip " + st.chip}>{st.rot}</span>
              </div>
              {a.corpo && <p className="dim" style={{ fontSize: 13.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.corpo}</p>}
              <div className="aviso-stats">
                <div><Users size={14} /><b>{a.alcance}</b><span>no público</span></div>
                <div><Eye size={14} /><b>{a.vistos}</b><span>viram ({pct}%)</span></div>
                <div><MousePointerClick size={14} /><b>{a.cliques}</b><span>clicaram</span></div>
              </div>
              <div className="funil__bar"><i style={{ width: `${pct}%` }} /></div>
              <div className="row" style={{ gap: 8 }}>
                <button className="copy-btn" onClick={() => setEditando({ id: a.id, titulo: a.titulo, corpo: a.corpo, tipo: a.tipo, tom: a.tom, publico: a.publico, cta_texto: a.cta_texto, cta_url: a.cta_url, inicio: a.inicio, fim: a.fim, ativo: a.ativo })}><Pencil size={15} /> Editar</button>
                <button className="icon-btn" onClick={() => excluir(a)} aria-label="Excluir"><Trash2 size={16} /></button>
              </div>
            </article>
          );
        })}
      </div>
      {editando && <Editor inicial={editando} onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); carregar(); }} />}
    </Shell>
  );
}
