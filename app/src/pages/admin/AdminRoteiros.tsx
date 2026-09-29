import { useEffect, useState } from "react";
import Portal from "../../components/Portal";
import { ArrowLeft, ArrowRight, Check, FileDown, Film, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import ImportarRoteiros from "./ImportarRoteiros";
import { MARCAS, SEGMENTOS } from "../../content";
import { api, ErroApp, hojeSP, type Midia, type Roteiro, type RoteiroNovo, type Segmento } from "../../lib/api";
import Shell from "../../components/Shell";

export const TIPOS: { k: Roteiro["tipo"]; rot: string }[] = [
  { k: "roteiro", rot: "Roteiro falado" },
  { k: "react", rot: "React" },
  { k: "fofoca", rot: "Fofoca (2 imagens)" },
];

const vazio = (data: string, segmento: Segmento): RoteiroNovo => ({ data, segmento, marca: "kingpanda", titulo: "", texto: "", midias: [], legenda: null, instrucoes: null, tipo: "roteiro", creditos: null, pronuncia: null, ordem: 0, publicado: true });

function Editor({ inicial, onFechar, onSalvo }: { inicial: RoteiroNovo; onFechar: () => void; onSalvo: () => void }) {
  const [r, setR] = useState<RoteiroNovo>(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const set = <K extends keyof RoteiroNovo>(k: K, v: RoteiroNovo[K]) => setR((x) => ({ ...x, [k]: v }));

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    setErro(""); setEnviando(true);
    try {
      const novas: Midia[] = [];
      for (const f of Array.from(arquivos)) novas.push(await api.enviarMidia(f));
      setR((x) => ({ ...x, midias: [...x.midias, ...novas] }));
    } catch (x) { setErro(x instanceof ErroApp ? x.message : "Falha no envio do arquivo."); } finally { setEnviando(false); }
  }
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try { await api.salvarRoteiro(r); onSalvo(); } catch (x) { setErro(x instanceof ErroApp ? x.message : "Não deu pra salvar."); } finally { setEnviando(false); }
  }

  return (
    <Portal>
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
        <div className="field"><label>Tipo</label>
          <div className="pills">{TIPOS.map((t) => (
            <button type="button" key={t.k} className={"pill-opt" + (r.tipo === t.k ? " on" : "")} onClick={() => set("tipo", t.k)}>{t.rot}</button>
          ))}</div>
        </div>
        <div className="field"><label>Título</label>
          <div className="input-wrap"><input required value={r.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Virada histórica no clássico" /></div></div>
        <div className="field"><label>Créditos <span className="dim">(opcional)</span></label>
          <div className="input-wrap"><input value={r.creditos ?? ""} onChange={(e) => set("creditos", e.target.value || null)} placeholder="Ex.: Créditos: @tntsportsbr" /></div></div>
        <div className="field"><label>Roteiro {r.tipo === "react" && <span className="dim">(opcional no React)</span>}</label>
          <textarea className="textarea" required={r.tipo !== "react"} rows={9} value={r.texto} onChange={(e) => set("texto", e.target.value)} placeholder="Cole o roteiro completo aqui…" />
          <span className="hint">{r.texto.trim().split(/\s+/).filter(Boolean).length} palavras · ~{Math.round(r.texto.trim().split(/\s+/).filter(Boolean).length / 2.6)}s de fala</span>
        </div>
        <div className="field"><label>Pronúncia <span className="dim">(opcional)</span></label>
          <div className="input-wrap"><input value={r.pronuncia ?? ""} onChange={(e) => set("pronuncia", e.target.value || null)} placeholder="Ex.: Haaland = HÁ-land" /></div></div>
        <div className="field"><label>Legenda do post <span className="dim">(opcional)</span></label>
          <textarea className="textarea" style={{ minHeight: 90 }} value={r.legenda ?? ""} onChange={(e) => set("legenda", e.target.value || null)} placeholder="Legenda pronta, com hashtags e rodapé" /></div>
        <div className="field"><label>Instruções de postagem <span className="dim">(opcional)</span></label>
          <textarea className="textarea" style={{ minHeight: 70 }} value={r.instrucoes ?? ""} onChange={(e) => set("instrucoes", e.target.value || null)} placeholder="Ex.: use a imagem 1 no começo; faça React em cima do vídeo base" /></div>
        <div className="field"><label>Imagens e vídeos base <span className="dim">(opcional)</span></label>
          {r.midias.length > 0 && (
            <div className="midias-adm">
              {r.midias.map((m, k) => (
                <div key={m.url} className="midia-adm">
                  {m.tipo === "imagem" ? <img src={m.url} alt="" /> : <span className="midia-adm__vid"><Film size={18} /></span>}
                  <span>{m.nome}</span>
                  <button type="button" className="icon-btn" aria-label="Remover" onClick={() => set("midias", r.midias.filter((_, j) => j !== k))}><X size={15} /></button>
                </div>
              ))}
            </div>
          )}
          <label className="upload"><ImagePlus size={20} strokeWidth={1.8} /> {enviando ? "Enviando…" : "Adicionar imagens ou vídeos"}<input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { enviar(e.target.files); e.target.value = ""; }} /></label>
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
    </Portal>
  );
}

export default function AdminRoteiros() {
  const [data, setData] = useState(hojeSP());
  const [lista, setLista] = useState<Roteiro[] | null>(null);
  const [editando, setEditando] = useState<RoteiroNovo | null>(null);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = () => { setLista(null); api.roteiros(data).then(setLista).catch((e) => { setErro(e.message); setLista([]); }); };
  useEffect(carregar, [data]);

  async function excluir(r: Roteiro) {
    if (!confirm(`Excluir "${r.titulo}"?`)) return;
    try { await api.excluirRoteiro(r.id); carregar(); } catch (e) { setErro((e as Error).message); }
  }

  const mudarDia = (d: number) => { const x = new Date(data + "T12:00:00"); x.setDate(x.getDate() + d); setData(x.toISOString().slice(0, 10)); };

  return (
    <Shell titulo="Publicar roteiros" acao={<div className="row" style={{ gap: 8 }}><button className="btn btn--sm btn--ghost" onClick={() => setImportando(true)}><FileDown size={17} /> Importar do Doc</button><button className="btn btn--sm" onClick={() => setEditando(vazio(data, "esp"))}><Plus size={17} /> Novo</button></div>}>
      <div className="daybar">
        <button className="icon-btn" onClick={() => mudarDia(-1)} aria-label="Dia anterior"><ArrowLeft size={17} /></button>
        <div className="input-wrap" style={{ flex: 1, minHeight: 46 }}><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <button className="icon-btn" onClick={() => mudarDia(1)} aria-label="Próximo dia"><ArrowRight size={17} /></button>
      </div>
      {erro && <div className="alert">{erro}</div>}
      <section className="card stack" style={{ marginTop: 14, maxWidth: 720, marginInline: "auto" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="card__t">Roteiros do dia <span className="count">{lista?.length ?? 0}</span></span>
          <button className="icon-btn" onClick={() => setEditando(vazio(data, "esp"))} aria-label="Novo roteiro"><Plus size={17} /></button>
        </div>
        {lista === null && <div className="skel" style={{ height: 64, borderRadius: 14 }} />}
        {lista !== null && lista.length === 0 && <span className="dim">Nenhum roteiro neste dia. Use “Importar do Doc” ou “Novo”.</span>}
        {[...(lista ?? [])].sort((a, b) => (a.ordem || 999) - (b.ordem || 999)).map((r, i, arr) => (
          <div key={r.id}>
            {(i === 0 || arr[i - 1].segmento !== r.segmento) && (
              <div className="adm-secao">{(() => { const S = SEGMENTOS[r.segmento]; return <><S.icon size={14} /> {i === 0 ? "" : "A partir daqui: "}{S.nome}</>; })()}</div>
            )}
            <div className={"adm-rot" + (r.publicado ? "" : " off")}>
              <span className="imp-item__n">{r.ordem || i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => setEditando(r)} role="button">
                <b>{r.titulo}</b>
                <span>{[r.marca && (MARCAS[r.marca] ?? r.marca), r.tipo === "react" ? "React" : r.tipo === "fofoca" ? "Fofoca" : "", r.midias?.length ? `${r.midias.length} ${r.midias.length === 1 ? "arquivo" : "arquivos"}` : "", r.publicado ? "" : "rascunho"].filter(Boolean).join(" · ")}</span>
              </div>
              <button className="icon-btn" onClick={() => setEditando(r)} aria-label="Editar"><Pencil size={16} /></button>
              <button className="icon-btn" onClick={() => excluir(r)} aria-label="Excluir"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </section>
      {importando && <ImportarRoteiros data={data} existentes={lista ?? []} onFechar={() => setImportando(false)} onPronto={(d) => { setImportando(false); setData(d); carregar(); }} />}
      {editando && <Editor inicial={editando} onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); carregar(); }} />}
    </Shell>
  );
}
