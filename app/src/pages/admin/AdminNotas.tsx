import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Receipt, X } from "lucide-react";
import { api, BRL, ddmm, type NotaAdmin, type StatusNf } from "../../lib/api";
import Shell, { Avatar } from "../../components/Shell";
import { InstagramLogo } from "../../components/Icon";
import { STATUS_NF } from "../../components/NotaFiscal";

const ABAS: { k: StatusNf | "todas"; rot: string }[] = [
  { k: "enviada", rot: "Em análise" },
  { k: "aprovada", rot: "Aprovadas" },
  { k: "recusada", rot: "Recusadas" },
  { k: "todas", rot: "Todas" },
];

function Nota({ n, onMudou }: { n: NotaAdmin; onMudou: () => void }) {
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const st = STATUS_NF[n.status];

  async function revisar(status: "aprovada" | "recusada") {
    setOcupado(true);
    try { await api.adminNfRevisar(n.id, status, motivo); onMudou(); }
    catch (e) { alert((e as Error).message); }
    finally { setOcupado(false); }
  }
  async function abrir() {
    try { window.open(await api.nfUrl(n.arquivo_path), "_blank", "noopener"); } catch { alert("Não deu pra abrir o arquivo."); }
  }

  return (
    <article className="pessoa">
      <div className="pessoa__top">
        <Avatar nome={n.nome} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}><b>{n.nome}</b><span>{n.email ?? ""}</span></div>
        <span className={"chip " + st.chip}>{st.rot}</span>
      </div>
      <div className="nf-valor">
        <div><span>NF {n.numero}</span><b>{BRL(Number(n.valor))}</b></div>
        <div><span>Ciclo</span><b>{ddmm(n.ciclo_start)} — {ddmm(n.ciclo_end)}</b></div>
      </div>
      <div className="pessoa__meta">
        {n.ig_esp && <span><InstagramLogo size={13} /> @{n.ig_esp}</span>}
        <span>Enviada em {ddmm(n.enviada_em.slice(0, 10))}</span>
      </div>
      {n.status === "recusada" && n.motivo && <div className="dim">Motivo: {n.motivo}</div>}
      {recusando ? (
        <div className="stack" style={{ gap: 8 }}>
          <div className="input-wrap"><input autoFocus placeholder="Motivo da recusa (o criador vê)" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn--sm" disabled={!motivo.trim() || ocupado} onClick={() => revisar("recusada")}>Confirmar recusa</button>
            <button className="link-btn" onClick={() => setRecusando(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="copy-btn" onClick={abrir}><ExternalLink size={16} /> Ver arquivo</button>
          {n.status !== "aprovada" && <button className="btn btn--sm btn--green" disabled={ocupado} onClick={() => revisar("aprovada")}><Check size={16} strokeWidth={2.4} /> Aprovar</button>}
          {n.status !== "recusada" && <button className="copy-btn" disabled={ocupado} onClick={() => setRecusando(true)}><X size={16} /> Recusar</button>}
        </div>
      )}
    </article>
  );
}

export default function AdminNotas() {
  const [lista, setLista] = useState<NotaAdmin[] | null>(null);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<StatusNf | "todas">("enviada");
  const [ciclo, setCiclo] = useState("");

  const carregar = () => api.adminNfs().then(setLista).catch((e) => { setErro(e.message); setLista([]); });
  useEffect(() => { carregar(); }, []);

  const ciclos = useMemo(() => [...new Set((lista ?? []).map((n) => n.ciclo_start))].sort().reverse(), [lista]);
  const conta = (k: StatusNf) => (lista ?? []).filter((n) => n.status === k && (!ciclo || n.ciclo_start === ciclo)).length;
  const itens = (lista ?? []).filter((n) => (aba === "todas" || n.status === aba) && (!ciclo || n.ciclo_start === ciclo));
  const total = itens.reduce((s, n) => s + Number(n.valor), 0);

  return (
    <Shell titulo="Notas fiscais">
      {ciclos.length > 1 && (
        <div className="ciclos">
          <button className={!ciclo ? "on" : ""} onClick={() => setCiclo("")}>Todos os ciclos</button>
          {ciclos.map((c) => <button key={c} className={ciclo === c ? "on" : ""} onClick={() => setCiclo(c)}>Ciclo {ddmm(c)}</button>)}
        </div>
      )}
      <div className="tabs-nf">
        {ABAS.map((a) => (
          <button key={a.k} className={aba === a.k ? "on" : ""} onClick={() => setAba(a.k)}>
            {a.rot}{a.k !== "todas" && <span className="count">{conta(a.k)}</span>}
          </button>
        ))}
      </div>
      {erro && <div className="alert">{erro}</div>}
      {lista && itens.length > 0 && <p className="dim" style={{ margin: "4px 0 12px" }}>{itens.length} {itens.length === 1 ? "nota" : "notas"} · total {BRL(total)}</p>}
      <div className="adm-grid">
        {lista === null && [0, 1].map((i) => <div key={i} className="skel" style={{ height: 150, borderRadius: 18 }} />)}
        {lista && itens.length === 0 && <div className="empty" style={{ gridColumn: "1 / -1" }}><Receipt size={28} strokeWidth={1.6} />Nenhuma nota aqui.</div>}
        {itens.map((n) => <Nota key={n.id} n={n} onMudou={carregar} />)}
      </div>
    </Shell>
  );
}
