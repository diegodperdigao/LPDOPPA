import { useCallback, useEffect, useRef, useState } from "react";
import Portal from "./Portal";
import { Camera, CircleAlert, CircleCheck, Clock, ExternalLink, FileText, FileUp, Hourglass, Receipt, RotateCcw, X } from "lucide-react";
import { api, BRL, ddmm, ErroApp, hojeSP, type NotaFiscal, type StatusNf } from "../lib/api";
import { IconTile, type Tom } from "./Icon";

type Ciclo = { start: string; end: string; label: string; isCurrent: boolean };

const somaDias = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export function useNfs() {
  const [nfs, setNfs] = useState<NotaFiscal[] | null>(null);
  const [prazo, setPrazo] = useState(5);
  const recarregar = useCallback(async () => {
    try {
      const [l, p] = await Promise.all([api.minhasNfs(), api.nfPrazoDias()]);
      setNfs(l); setPrazo(p);
    } catch { setNfs([]); }
  }, []);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { nfs, prazo, recarregar };
}

export const STATUS_NF: Record<StatusNf, { rot: string; chip: string; icon: typeof Clock; tom: Tom }> = {
  enviada: { rot: "Em análise", chip: "chip--yellow", icon: Hourglass, tom: "yellow" },
  aprovada: { rot: "Aprovada", chip: "chip--green", icon: CircleCheck, tom: "green" },
  recusada: { rot: "Recusada", chip: "chip--red", icon: CircleAlert, tom: "red" },
};

async function abrirArquivo(path: string) {
  try { window.open(await api.nfUrl(path), "_blank", "noopener"); } catch { alert("Não deu pra abrir o arquivo agora."); }
}

// Cartão da NF do ciclo selecionado na Carteira.
export function NfDoCiclo({ ciclo, nf, prazo, onEnviar }: { ciclo: Ciclo; nf: NotaFiscal | undefined; prazo: number; onEnviar: () => void }) {
  const liberaEm = somaDias(ciclo.end, 1);
  const limite = somaDias(ciclo.end, prazo);
  const atrasada = !nf && hojeSP() > limite;

  let corpo: React.ReactNode;
  if (ciclo.isCurrent) {
    corpo = (
      <div className="nf-linha">
        <IconTile icon={Clock} tom="neutral" size={40} />
        <div style={{ flex: 1 }}><b>Envio libera em {ddmm(liberaEm)}</b><span>Quando o ciclo fechar, você emite a NF e manda por aqui até {ddmm(limite)}.</span></div>
      </div>
    );
  } else if (!nf) {
    corpo = (
      <>
        <div className="nf-linha">
          <IconTile icon={atrasada ? CircleAlert : Receipt} tom={atrasada ? "red" : "violet"} size={40} />
          <div style={{ flex: 1 }}>
            <b>{atrasada ? "Prazo da NF passou" : "Envie a nota fiscal deste ciclo"}</b>
            <span>{atrasada ? `O prazo era ${ddmm(limite)}. Envie o quanto antes e avise o suporte.` : `Prazo: até ${ddmm(limite)}. PDF ou foto da nota.`}</span>
          </div>
        </div>
        <button className="btn" onClick={onEnviar}><FileUp size={18} /> Enviar nota fiscal</button>
      </>
    );
  } else {
    const st = STATUS_NF[nf.status];
    corpo = (
      <>
        <div className="nf-linha">
          <IconTile icon={st.icon} tom={st.tom} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>NF {nf.numero} · {BRL(Number(nf.valor))}</b>
            <span>Enviada em {ddmm(nf.enviada_em.slice(0, 10))}</span>
          </div>
          <span className={"chip " + st.chip}>{st.rot}</span>
        </div>
        {nf.status === "recusada" && nf.motivo && <div className="alert"><CircleAlert size={16} style={{ flex: "0 0 auto", marginTop: 2 }} /> <span><b style={{ fontWeight: 600 }}>Motivo:</b> {nf.motivo}</span></div>}
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <button className="copy-btn" onClick={() => abrirArquivo(nf.arquivo_path)}><ExternalLink size={16} /> Ver arquivo</button>
          {nf.status === "recusada" && <button className="btn btn--sm" onClick={onEnviar}><RotateCcw size={16} /> Reenviar NF</button>}
        </div>
      </>
    );
  }

  return (
    <section className="card stack" style={{ marginTop: 12 }}>
      <span className="card__t"><Receipt size={17} /> Nota fiscal · ciclo {ciclo.label}</span>
      {corpo}
    </section>
  );
}

// Modal de envio: arquivo (PDF ou foto), número e valor.
export function NfModal({ ciclo, onFechar, onEnviada }: { ciclo: Ciclo; onFechar: () => void; onEnviada: () => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [numero, setNumero] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputArq = useRef<HTMLInputElement>(null);
  const inputCam = useRef<HTMLInputElement>(null);
  const valorNum = Number(valor.replace(/\./g, "").replace(",", ".")) || 0;
  const valido = !!arquivo && numero.trim().length > 0 && valorNum > 0;

  function escolher(f: File | undefined) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setErro("Arquivo muito grande (máx. 10 MB)."); return; }
    setErro(""); setArquivo(f);
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setErro(""); setEnviando(true);
    try {
      await api.enviarNf({ ciclo_start: ciclo.start, ciclo_end: ciclo.end, numero: numero.trim(), valor: valorNum, arquivo });
      onEnviada();
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra enviar agora. Tenta de novo.");
    } finally { setEnviando(false); }
  }

  return (
    <Portal>
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal__sheet stack" onSubmit={enviar} role="dialog" aria-modal="true" aria-labelledby="nf-t">
        <div className="grab" />
        <div className="row between">
          <div><h2 id="nf-t" style={{ fontSize: 19, fontWeight: 700 }}>Enviar nota fiscal</h2><span className="dim">Ciclo {ciclo.label}</span></div>
          <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
        </div>

        {arquivo ? (
          <div className="nf-arq">
            <IconTile icon={FileText} tom="violet" size={40} />
            <div style={{ flex: 1, minWidth: 0 }}><b>{arquivo.name}</b><span>{(arquivo.size / 1024 / 1024).toFixed(1)} MB</span></div>
            <button type="button" className="icon-btn" onClick={() => setArquivo(null)} aria-label="Remover arquivo"><X size={16} /></button>
          </div>
        ) : (
          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button type="button" className="upload" style={{ flexDirection: "column", minHeight: 96 }} onClick={() => inputCam.current?.click()}><Camera size={22} /> Tirar foto</button>
            <button type="button" className="upload" style={{ flexDirection: "column", minHeight: 96 }} onClick={() => inputArq.current?.click()}><FileUp size={22} /> Escolher PDF</button>
          </div>
        )}
        <input ref={inputCam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => escolher(e.target.files?.[0])} />
        <input ref={inputArq} type="file" accept="application/pdf,image/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />

        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field"><label>Número da NF</label>
            <div className="input-wrap"><input required value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex.: 42" /></div></div>
          <div className="field"><label>Valor (R$)</label>
            <div className="input-wrap"><input required inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0,00" /></div></div>
        </div>
        {erro && <div className="alert">{erro}</div>}
        <button className="btn" disabled={!valido || enviando}>{enviando ? "Enviando…" : "Enviar nota fiscal"}</button>
      </form>
    </div>
    </Portal>
  );
}
