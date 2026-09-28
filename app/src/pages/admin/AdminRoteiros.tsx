import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { MARCAS, SEGMENTOS } from "../../content";
import { api, ErroApp, hojeSP, type Roteiro, type RoteiroNovo, type Segmento } from "../../lib/api";
import Shell from "../../components/Shell";

const vazio = (data: string, segmento: Segmento): RoteiroNovo => ({ data, segmento, marca: "kingpanda", titulo: "", texto: "", imagem_url: null, ordem: 0, publicado: true });

function Editor({ inicial, onFechar, onSalvo }: { inicial: RoteiroNovo; onFechar: () => void; onSalvo: () => void }) {
  const [r, setR] = useState<RoteiroNovo>(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const set = <K extends keyof RoteiroNovo>(k: K, v: RoteiroNovo[K]) => setR((x) => ({ ...x, [k]: v }));

  async function imagem(f: File | undefined) {
    if (!f) return;
    setErro(""); setEnviando(true);
    try { set("imagem_url", await api.enviarImagem(f)); } catch (x) { setErro(x instanceof ErroApp ? x.message : "Falha no envio da imagem."); } finally { setEnviando(false); }
  }
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try { await api.salvarRoteiro(r); onSalvo(); } catch (x) { setErro(x instanceof ErroApp ? x.message : "Não deu pra salvar."); } finally { setEnviando(false); }
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal__sheet stack" onSubmit={salvar} role="dialog" aria-modal="true">
        <div className="grab" />
        <h2 className="h-display h2">{r.id ? "Editar roteiro" : "Novo roteiro"}</h2>
        <div className="seg-tabs">
          {(["esp", "cas"] as Segmento[]).map((k) => (
            <button type="button" key={k} className={r.segmento === k ? "on" : ""} onClick={() => set("segmento", k)}>{(() => { const S = SEGMENTOS[k]; return <><S.icon size={16} strokeWidth={1.9} /> {S.curto}</>; })()}</button>
          ))}
        </div>
        <div className="field"><label>Marca</label>
          <div className="pills">{Object.entries(MARCAS).map(([k, v]) => (
            <button type="button" key={k} className={"pill-opt" + (r.marca === k ? " on" : "")} onClick={() => set("marca", k)}>{v}</button>
          ))}</div>
        </div>
        <div className="field"><label>Título</label>
          <div className="input-wrap"><input required value={r.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Virada histórica no clássico" /></div></div>
        <div className="field"><label>Roteiro</label>
          <textarea className="textarea" required rows={9} value={r.texto} onChange={(e) => set("texto", e.target.value)} placeholder="Cole o roteiro completo aqui…" />
          <span className="hint">{r.texto.trim().split(/\s+/).filter(Boolean).length} palavras · ~{Math.round(r.texto.trim().split(/\s+/).filter(Boolean).length / 2.6)}s de fala</span>
        </div>
        <div className="field"><label>Imagem (opcional)</label>
          {r.imagem_url ? (
            <div className="img-prev"><img src={r.imagem_url} alt="" /><button type="button" className="copy-btn" onClick={() => set("imagem_url", null)}>Remover</button></div>
          ) : (
            <label className="upload"><ImagePlus size={20} strokeWidth={1.8} /> {enviando ? "Enviando…" : "Escolher imagem"}<input type="file" accept="image/*" hidden onChange={(e) => imagem(e.target.files?.[0])} /></label>
          )}
        </div>
        <div className="row" style={{ gap: 16 }}>
          <div className="field" style={{ flex: 1 }}><label>Data</label>
            <div className="input-wrap"><input type="date" required value={r.data} onChange={(e) => set("data", e.target.value)} /></div></div>
          <div className="field" style={{ width: 110 }}><label>Ordem</label>
            <div className="input-wrap"><input type="number" value={r.ordem} onChange={(e) => set("ordem", Number(e.target.value) || 0)} /></div></div>
        </div>
        <button type="button" className={"check" + (r.publicado ? " on" : "")} onClick={() => set("publicado", !r.publicado)}>
          <span className="check__box"><Check size={15} strokeWidth={3} /></span><span>Publicado (visível pros criadores)</span>
        </button>
        {erro && <div className="alert">{erro}</div>}
        <button className="btn" disabled={enviando}>{enviando ? "Salvando…" : "Salvar roteiro"}</button>
        <button type="button" className="link-btn" onClick={onFechar}>Cancelar</button>
      </form>
    </div>
  );
}

export default function AdminRoteiros() {
  const [data, setData] = useState(hojeSP());
  const [lista, setLista] = useState<Roteiro[] | null>(null);
  const [editando, setEditando] = useState<RoteiroNovo | null>(null);
  const [erro, setErro] = useState("");

  const carregar = () => { setLista(null); api.roteiros(data).then(setLista).catch((e) => { setErro(e.message); setLista([]); }); };
  useEffect(carregar, [data]);

  async function excluir(r: Roteiro) {
    if (!confirm(`Excluir "${r.titulo}"?`)) return;
    try { await api.excluirRoteiro(r.id); carregar(); } catch (e) { setErro((e as Error).message); }
  }

  const mudarDia = (d: number) => { const x = new Date(data + "T12:00:00"); x.setDate(x.getDate() + d); setData(x.toISOString().slice(0, 10)); };

  return (
    <Shell titulo="Publicar roteiros" acao={<button className="btn btn--sm" onClick={() => setEditando(vazio(data, "esp"))}><Plus size={17} /> Novo</button>}>
      <div className="daybar">
        <button className="icon-btn" onClick={() => mudarDia(-1)} aria-label="Dia anterior"><ArrowLeft size={17} /></button>
        <div className="input-wrap" style={{ flex: 1, minHeight: 46 }}><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <button className="icon-btn" onClick={() => mudarDia(1)} aria-label="Próximo dia"><ArrowRight size={17} /></button>
      </div>
      {erro && <div className="alert">{erro}</div>}
      <div className="grid-2" style={{ marginTop: 14 }}>
        {(["esp", "cas"] as Segmento[]).map((seg) => {
          const itens = (lista ?? []).filter((r) => r.segmento === seg);
          return (
            <section key={seg} className="card stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="card__t">{(() => { const S = SEGMENTOS[seg]; return <S.icon size={17} />; })()} {SEGMENTOS[seg].nome} <span className="count">{itens.length}</span></span>
                <button className="icon-btn" onClick={() => setEditando(vazio(data, seg))} aria-label="Novo roteiro"><Plus size={17} /></button>
              </div>
              {lista === null && <div className="skel" style={{ height: 64, borderRadius: 14 }} />}
              {lista !== null && itens.length === 0 && <span className="dim">Nenhum roteiro neste dia.</span>}
              {itens.map((r) => (
                <div key={r.id} className={"adm-rot" + (r.publicado ? "" : " off")}>
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => setEditando(r)} role="button">
                    <b>{r.titulo}</b>
                    <span>{r.marca ? MARCAS[r.marca] ?? r.marca : ""} {r.publicado ? "" : "· rascunho"} {r.imagem_url ? "· com imagem" : ""}</span>
                  </div>
                  <button className="icon-btn" onClick={() => setEditando(r)} aria-label="Editar"><Pencil size={16} /></button>
                  <button className="icon-btn" onClick={() => excluir(r)} aria-label="Excluir"><Trash2 size={16} /></button>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {editando && <Editor inicial={editando} onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); carregar(); }} />}
    </Shell>
  );
}
