import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CalendarRange, ChevronRight, Clock3, FileSignature, LockOpen } from "lucide-react";
import { SEGMENTOS } from "../content";
import { api, ddmm, hojeSP, type Roteiro } from "../lib/api";
import { useConta } from "../lib/conta";
import { useAvisos } from "../lib/avisos";
import { ultimaContagem, usePainel } from "../lib/painel";
import Shell from "../components/Shell";
import TermoModal from "../components/TermoModal";
import { IconTile } from "../components/Icon";
import { Confetti } from "../components/ui";
import { DiasGrid, HeroCiclo, Kpis } from "../components/Ciclo";

export default function Inicio() {
  const { conta } = useConta();
  const liberado = (useLocation().state as { liberado?: boolean } | null)?.liberado;
  const { dados, erro } = usePainel();
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [termo, setTermo] = useState(false);
  const { avisos } = useAvisos();
  const temPopup = avisos.some((a) => a.tipo === "popup" && !a.lido);

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);
  // O termo abre sozinho só se não houver um aviso em pop-up na frente (um modal por vez).
  useEffect(() => {
    if (!conta || conta.termo_em || temPopup) return;
    let visto = false;
    try { visto = sessionStorage.getItem("termo_pop") === "1"; sessionStorage.setItem("termo_pop", "1"); } catch { /* sem storage */ }
    if (visto) return;
    const t = setTimeout(() => setTermo(true), liberado ? 3500 : 1500);
    return () => clearTimeout(t);
  }, [conta, liberado, temPopup]);

  const ult = dados ? ultimaContagem(dados) : null;
  const handles = [
    conta?.ig_esp && { tag: "ESP", h: conta.ig_esp },
    conta?.ig_cas && { tag: "NOT", h: conta.ig_cas },
  ].filter(Boolean) as { tag: string; h: string }[];

  return (
    <Shell titulo="Início">
      {liberado && <Confetti />}

      {liberado && (
        <div className="card card--glow" style={{ marginBottom: 12 }}>
          <div className="row">
            <IconTile icon={LockOpen} tom="green" size={40} />
            <div style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>Roteiros liberados!</b><div className="dim">Escolha um, copie, grave e poste.</div></div>
          </div>
          <Link to="/roteiros" className="btn" style={{ marginTop: 14 }}>Ver roteiros de hoje <ArrowRight size={18} /></Link>
        </div>
      )}

      {conta && !conta.termo_em && (
        <button className="banner" style={{ marginBottom: 12 }} onClick={() => setTermo(true)}>
          <IconTile icon={FileSignature} tom="yellow" size={38} />
          <span style={{ flex: 1 }}><b>Assine o termo pra receber</b><span>Seus vídeos já contam. O pagamento só sai com o termo assinado.</span></span>
          <ChevronRight size={18} />
        </button>
      )}

      {dados ? (
        <HeroCiclo p={dados} nome={conta?.nome || "Criador"} handles={handles} />
      ) : (
        <div className="skel" style={{ height: 230, borderRadius: 22 }} />
      )}

      <div className="contagem">
        <Clock3 size={16} />
        <span>Os vídeos entram na contagem <b>no dia seguinte</b>.{ult && <> Última contagem: <b>{ddmm(ult.date)}</b>, {ult.videos} vídeos.</>}</span>
      </div>

      {dados && <Kpis p={dados} />}
      {erro && <div className="alert" style={{ marginTop: 12 }}>{erro}</div>}

      {dados && dados.my.days.length > 0 && (
        <section className="card" style={{ marginTop: 12 }}>
          <div className="card-h"><IconTile icon={CalendarRange} tom="violet" size={30} /> Últimos dias <small><Link to="/carteira" className="link-btn" style={{ padding: 0, fontSize: 12.5 }}>Ciclo completo <ArrowRight size={13} /></Link></small></div>
          <DiasGrid dias={dados.my.days} meta={dados.params.meta} ultimos={7} />
        </section>
      )}

      <div className="sec-t">
        <h3>Roteiros de hoje</h3>
        <Link to="/roteiros" className="link-btn" style={{ padding: 0 }}>Ver todos <ArrowRight size={15} /></Link>
      </div>
      <div className="rot-mini">
        {roteiros === null && [0, 1].map((i) => <div key={i} className="skel" style={{ height: 68, borderRadius: 14 }} />)}
        {roteiros?.length === 0 && <div className="card muted center">Os roteiros de hoje ainda não saíram. A gente avisa no grupo.</div>}
        {roteiros?.slice(0, 3).map((r) => {
          const S = SEGMENTOS[r.segmento];
          return (
            <Link key={r.id} to="/roteiros" className="rot-mini__i">
              <IconTile icon={S.icon} tom={S.tom} size={38} />
              <span style={{ flex: 1, minWidth: 0 }}><b>{r.titulo}</b><span>{r.texto.slice(0, 80)}</span></span>
              <ChevronRight size={18} />
            </Link>
          );
        })}
      </div>

      {termo && <TermoModal onFechar={() => setTermo(false)} />}
    </Shell>
  );
}
