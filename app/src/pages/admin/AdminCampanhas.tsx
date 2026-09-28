import { useEffect, useState } from "react";
import { Check, Flag, Pencil, Plus, Trash2, X } from "lucide-react";
import { MARCAS } from "../../content";
import { api, ddmm, ErroApp, hojeSP, type Campanha, type CampanhaNova } from "../../lib/api";
import Shell from "../../components/Shell";
import Portal from "../../components/Portal";
import { IconTile } from "../../components/Icon";

const vazia = (): CampanhaNova => ({ titulo: "", ciclo: "", inicio: hojeSP(), fim: null, marcas: [], meta_dia: null, duracao_min: null, valor_mes: null, regras: [], corpo: "", publicado: true });
const num = (v: string) => (v.trim() === "" ? null : Number(v));

function Editor({ inicial, onFechar, onSalvo }: { inicial: CampanhaNova; onFechar: () => void; onSalvo: () => void }) {
  const [c, setC] = useState<CampanhaNova>(inicial);
  const [regras, setRegras] = useState(inicial.regras.join("\n"));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof CampanhaNova>(k: K, v: CampanhaNova[K]) => setC((x) => ({ ...x, [k]: v }));
  const marca = (m: string) => set("marcas", c.marcas.includes(m) ? c.marcas.filter((x) => x !== m) : [...c.marcas, m]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setSalvando(true);
    try {
      await api.salvarCampanha({ ...c, ciclo: c.ciclo?.trim() || null, regras: regras.split("\n").map((r) => r.trim()).filter(Boolean) });
      onSalvo();
    } catch (x) { setErro(x instanceof ErroApp ? x.message : "Não deu pra salvar."); } finally { setSalvando(false); }
  }

  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <form className="modal__sheet stack" onSubmit={salvar} role="dialog" aria-modal="true">
          <div className="row between">
            <h2 style={{ fontSize: 19, fontWeight: 700 }}>{c.id ? "Editar campanha" : "Nova campanha"}</h2>
            <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: "1fr 2fr" }}>
            <div className="field"><label>Ciclo</label>
              <div className="input-wrap"><input value={c.ciclo ?? ""} onChange={(e) => set("ciclo", e.target.value)} placeholder="Ciclo 4" /></div></div>
            <div className="field"><label>Título</label>
              <div className="input-wrap"><input required maxLength={80} value={c.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="King Panda + Superbet" /></div></div>
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field"><label>Começa</label>
              <div className="input-wrap"><input type="date" required value={c.inicio} onChange={(e) => set("inicio", e.target.value)} /></div></div>
            <div className="field"><label>Termina</label>
              <div className="input-wrap"><input type="date" value={c.fim ?? ""} onChange={(e) => set("fim", e.target.value || null)} /></div></div>
          </div>

          <div className="field"><label>Marcas</label>
            <div className="pills">{Object.entries(MARCAS).map(([k, nome]) => (
              <button type="button" key={k} className={"pill-opt" + (c.marcas.includes(k) ? " on" : "")} onClick={() => marca(k)}>{nome}</button>
            ))}</div>
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="field"><label>Vídeos/dia</label>
              <div className="input-wrap"><input inputMode="numeric" value={c.meta_dia ?? ""} onChange={(e) => set("meta_dia", num(e.target.value))} placeholder="30" /></div></div>
            <div className="field"><label>Mínimo (s)</label>
              <div className="input-wrap"><input inputMode="numeric" value={c.duracao_min ?? ""} onChange={(e) => set("duracao_min", num(e.target.value))} placeholder="30" /></div></div>
            <div className="field"><label>R$/mês</label>
              <div className="input-wrap"><input inputMode="decimal" value={c.valor_mes ?? ""} onChange={(e) => set("valor_mes", num(e.target.value.replace(",", ".")))} placeholder="1400" /></div></div>
          </div>

          <div className="field"><label>Regras <span className="dim">(uma por linha)</span></label>
            <textarea className="textarea" style={{ minHeight: 110 }} value={regras} onChange={(e) => setRegras(e.target.value)} placeholder={"Vídeos com no mínimo 30 segundos\nNada de IA"} /></div>
          <div className="field"><label>Texto do post</label>
            <textarea className="textarea" style={{ minHeight: 160 }} value={c.corpo} onChange={(e) => set("corpo", e.target.value)} placeholder="Cole aqui o texto que ia no #campanhas-ativas" /></div>

          <button type="button" className={"check" + (c.publicado ? " on" : "")} onClick={() => set("publicado", !c.publicado)}>
            <span className="check__box"><Check size={15} strokeWidth={3} /></span><span>Publicada (desmarque pra deixar como rascunho)</span>
          </button>
          {erro && <div className="alert">{erro}</div>}
          <button className="btn" disabled={salvando || !c.titulo.trim()}>{salvando ? "Salvando…" : c.id ? "Salvar alterações" : "Publicar campanha"}</button>
        </form>
      </div>
    </Portal>
  );
}

export default function AdminCampanhas() {
  const [lista, setLista] = useState<Campanha[] | null>(null);
  const [editando, setEditando] = useState<CampanhaNova | null>(null);
  const [erro, setErro] = useState("");
  const carregar = () => { api.adminCampanhas().then(setLista).catch((e) => { setErro(e.message); setLista([]); }); };
  useEffect(carregar, []);

  async function excluir(c: Campanha) {
    if (!confirm(`Excluir a campanha "${c.titulo}"?`)) return;
    try { await api.excluirCampanha(c.id); carregar(); } catch (e) { setErro((e as Error).message); }
  }

  return (
    <Shell titulo="Campanhas" acao={<button className="btn btn--sm" onClick={() => setEditando(vazia())}><Plus size={17} /> Nova</button>}>
      {erro && <div className="alert">{erro}</div>}
      <div className="adm-grid">
        {lista === null && [0, 1].map((i) => <div key={i} className="skel" style={{ height: 120, borderRadius: 18 }} />)}
        {lista?.length === 0 && <div className="empty" style={{ gridColumn: "1 / -1" }}><IconTile icon={Flag} tom="violet" size={52} />Nenhuma campanha ainda. Publique a do ciclo atual no botão “Nova”.</div>}
        {lista?.map((c) => (
          <article key={c.id} className="pessoa">
            <div className="pessoa__top">
              <IconTile icon={Flag} tom="violet" size={38} />
              <div style={{ flex: 1, minWidth: 0 }}><b>{c.ciclo ? `${c.ciclo} · ` : ""}{c.titulo}</b><span>{ddmm(c.inicio)}{c.fim ? ` a ${ddmm(c.fim)}` : ""}</span></div>
              <span className={"chip " + (c.publicado ? "chip--green" : "")}>{c.publicado ? "Publicada" : "Rascunho"}</span>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {c.marcas.map((m) => <span key={m} className="chip">{MARCAS[m] ?? m}</span>)}
              {c.meta_dia && <span className="chip">{c.meta_dia} vídeos/dia</span>}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="copy-btn" onClick={() => { const { id, ...r } = c; setEditando({ id, ...r }); }}><Pencil size={15} /> Editar</button>
              <button className="icon-btn" onClick={() => excluir(c)} aria-label="Excluir"><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>
      {editando && <Editor inicial={editando} onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); carregar(); }} />}
    </Shell>
  );
}
