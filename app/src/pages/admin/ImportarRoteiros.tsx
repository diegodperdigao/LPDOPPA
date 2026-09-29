import { useMemo, useState } from "react";
import { CircleAlert, CircleCheck, ClipboardPaste, FileArchive, Film, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { MARCAS, SEGMENTOS } from "../../content";
import { api, ErroApp, type Midia, type Roteiro, type RoteiroNovo } from "../../lib/api";
import { lerRoteiros, numeroDoArquivo, type RoteiroLido } from "../../lib/importar";
import { abrirArquivos, htmlParaTexto } from "../../lib/arquivos";
import Portal from "../../components/Portal";

const TIPO_ROT: Record<RoteiroLido["tipo"], string> = { roteiro: "Roteiro", react: "React", fofoca: "Fofoca · 2 imagens" };

// Rótulo que o criador vê em cada arquivo.
function rotuloDe(r: RoteiroLido, parte: number, video: boolean) {
  if (video) return "Vídeo base";
  if (r.tipo === "fofoca") return parte === 0 ? "Foto inicial" : "Card";
  return "Imagem";
}

export default function ImportarRoteiros({ data: dataInicial, existentes, onFechar, onPronto }: { data: string; existentes: Roteiro[]; onFechar: () => void; onPronto: (data: string) => void }) {
  const [data, setData] = useState(dataInicial);
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [abrindo, setAbrindo] = useState("");
  const [substituir, setSubstituir] = useState(existentes.length > 0);
  const [enviando, setEnviando] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [feito, setFeito] = useState(false);

  const lido = useMemo(() => (texto.trim() ? lerRoteiros(texto) : null), [texto]);

  // Liga cada arquivo ao roteiro pelo número do nome ("25.1.png" → roteiro 25, 2ª imagem).
  const porNumero = useMemo(() => {
    const m = new Map<number, { arq: File; parte: number }[]>();
    const soltos: string[] = [];
    for (const arq of arquivos) {
      const n = numeroDoArquivo(arq.name);
      if (!n || !lido?.roteiros.some((r) => r.numero === n.numero)) { soltos.push(arq.name); continue; }
      m.set(n.numero, [...(m.get(n.numero) ?? []), { arq, parte: n.parte }].sort((a, b) => a.parte - b.parte));
    }
    return { m, soltos };
  }, [arquivos, lido]);

  const alertasArquivo = (r: RoteiroLido) => {
    const fs = porNumero.m.get(r.numero) ?? [];
    const a: string[] = [];
    if (arquivos.length && r.tipo === "react" && !fs.some((f) => f.arq.type.startsWith("video/"))) a.push("React sem vídeo base.");
    if (arquivos.length && r.tipo === "fofoca" && fs.length < 2) a.push("Fofoca pede 2 imagens (foto + card).");
    fs.filter((f) => f.arq.size > 100 * 1024 * 1024).forEach((f) => a.push(`${f.arq.name} passa de 100MB.`));
    return a;
  };

  async function colar(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    if (!html) return;
    e.preventDefault();
    setTexto(htmlParaTexto(html));
  }

  async function adicionar(lista: FileList | null) {
    if (!lista?.length) return;
    setAbrindo("Lendo arquivos…");
    try { const novos = await abrirArquivos(lista, setAbrindo); setArquivos((a) => [...a, ...novos]); }
    catch { setErros(["Não deu pra abrir o .zip."]); } finally { setAbrindo(""); }
  }

  async function publicar() {
    if (!lido) return;
    setErros([]);
    const falhas: string[] = [];
    try {
      if (substituir) {
        setEnviando("Removendo os roteiros antigos do dia…");
        for (const r of existentes) await api.excluirRoteiro(r.id);
      }
      const total = arquivos.length;
      let enviados = 0;
      for (const r of lido.roteiros) {
        const midias: Midia[] = [];
        for (const { arq, parte } of porNumero.m.get(r.numero) ?? []) {
          setEnviando(`Enviando arquivos ${++enviados}/${total}… (${arq.name})`);
          try {
            const m = await api.enviarMidia(arq);
            midias.push({ ...m, rotulo: rotuloDe(r, parte, m.tipo === "video") });
          } catch (x) { falhas.push(`${arq.name}: ${x instanceof ErroApp ? x.message : "falhou o envio"}`); }
        }
        setEnviando(`Salvando roteiro ${r.numero} de ${lido.roteiros.length}…`);
        const novo: RoteiroNovo = {
          data, segmento: r.segmento, marca: r.marca, titulo: r.titulo, texto: r.texto, midias,
          legenda: r.legenda, instrucoes: r.instrucoes, tipo: r.tipo, creditos: r.creditos, pronuncia: r.pronuncia,
          ordem: r.numero, publicado: true,
        };
        try { await api.salvarRoteiro(novo); } catch (x) { falhas.push(`Roteiro ${r.numero}: ${x instanceof ErroApp ? x.message : "não salvou"}`); }
      }
      setErros(falhas);
      setFeito(true);
    } finally { setEnviando(""); }
  }

  const nEsp = lido?.roteiros.filter((r) => r.segmento === "esp").length ?? 0;
  const nCas = lido?.roteiros.filter((r) => r.segmento === "cas").length ?? 0;

  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && !enviando && onFechar()}>
        <div className="modal__sheet stack importar" role="dialog" aria-modal="true">
          <div className="row between">
            <h2 style={{ fontSize: 19, fontWeight: 700 }}>Importar roteiros do Doc</h2>
            <button className="icon-btn" onClick={onFechar} disabled={!!enviando} aria-label="Fechar"><X size={18} /></button>
          </div>

          {feito ? (
            <div className="stack center" style={{ padding: "18px 0" }}>
              <CircleCheck size={44} color="var(--green)" style={{ margin: "0 auto" }} />
              <b style={{ fontSize: 17 }}>{lido?.roteiros.length} roteiros publicados</b>
              {erros.length > 0 && <div className="alert" style={{ textAlign: "left" }}>{erros.map((e) => <div key={e}>{e}</div>)}</div>}
              <button className="btn" onClick={() => onPronto(data)}>Ver os roteiros</button>
            </div>
          ) : (
            <>
              <div className="field"><label>Dia dos roteiros</label>
                <div className="input-wrap"><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div></div>

              <div className="field"><label><span className="imp-n">1</span> Cole o conteúdo do Doc</label>
                <textarea className="textarea" style={{ minHeight: 120 }} value={texto} onChange={(e) => setTexto(e.target.value)} onPaste={colar}
                  placeholder="No Google Docs: Ctrl+A, Ctrl+C e cole aqui (Ctrl+V)" />
                <span className="hint"><ClipboardPaste size={13} style={{ verticalAlign: -2 }} /> Os títulos numerados (1., 2 -, 25.…) viram roteiros. O aviso “A PARTIR DAQUI… NOTÍCIAS/VARIEDADES” muda o segmento.</span>
              </div>

              <div className="field"><label><span className="imp-n">2</span> Adicione os arquivos do Drive</label>
                <label className="upload" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); adicionar(e.dataTransfer.files); }}>
                  {abrindo ? <Loader2 size={20} className="gira" /> : <FileArchive size={20} strokeWidth={1.8} />}
                  {abrindo || (arquivos.length ? `${arquivos.length} arquivos · adicionar mais` : "Arraste o .zip da pasta (ou as imagens e vídeos)")}
                  <input type="file" multiple hidden accept="image/*,video/*,.zip,application/zip" onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }} />
                </label>
                <span className="hint">No Drive: botão direito na pasta → Fazer download. O número no nome liga o arquivo ao roteiro (4.png → 4; 25.1.png → 2ª imagem do 25).</span>
              </div>

              {lido && (
                <>
                  <div className="imp-resumo">
                    <b>{lido.roteiros.length} roteiros</b>
                    <span>{nEsp} Esportes · {nCas} Notícias/Variedades · {arquivos.length} arquivos</span>
                  </div>
                  {porNumero.soltos.length > 0 && <div className="alert"><CircleAlert size={15} style={{ verticalAlign: -3 }} /> Arquivos sem roteiro: {porNumero.soltos.join(", ")}</div>}
                  <div className="imp-lista">
                    {lido.roteiros.map((r) => {
                      const fs = porNumero.m.get(r.numero) ?? [];
                      const alertas = [...r.avisos, ...alertasArquivo(r)];
                      return (
                        <div key={r.numero} className={"imp-item" + (alertas.length ? " aviso" : "")}>
                          <span className="imp-item__n">{r.numero}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b>{r.titulo}</b>
                            <div className="imp-item__chips">
                              <span className={"chip " + (r.segmento === "esp" ? "chip--green" : "")}>{SEGMENTOS[r.segmento].curto}</span>
                              <span className="chip">{TIPO_ROT[r.tipo]}</span>
                              {r.marca && <span className="chip chip--violet">{MARCAS[r.marca] ?? r.marca}</span>}
                              {fs.map((f) => <span key={f.arq.name} className="chip">{f.arq.type.startsWith("video/") ? <Film size={11} /> : <ImageIcon size={11} />} {f.arq.name}</span>)}
                            </div>
                            {alertas.map((a) => <div key={a} className="imp-item__av"><CircleAlert size={13} /> {a}</div>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {existentes.length > 0 && (
                    <button type="button" className={"check" + (substituir ? " on" : "")} onClick={() => setSubstituir(!substituir)}>
                      <span className="check__box"><CircleCheck size={15} /></span><span>Substituir os {existentes.length} roteiros que já estão nesse dia</span>
                    </button>
                  )}
                </>
              )}

              {erros.length > 0 && <div className="alert">{erros.join(" ")}</div>}
              <button className="btn" disabled={!lido?.roteiros.length || !!enviando || !!abrindo} onClick={publicar}>
                {enviando ? <><Loader2 size={17} className="gira" /> {enviando}</> : <><Upload size={17} /> Publicar {lido?.roteiros.length ?? 0} roteiros</>}
              </button>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
