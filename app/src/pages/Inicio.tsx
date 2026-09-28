import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CalendarCheck, ChartColumn, ChevronRight, Film, Flame, FileSignature, LockOpen, Target, Ticket } from "lucide-react";
import { SEGMENTOS } from "../content";
import { api, BRL, ddmm, hojeSP, type Roteiro } from "../lib/api";
import { useConta } from "../lib/conta";
import { ultimaContagem, usePainel } from "../lib/painel";
import Shell from "../components/Shell";
import TermoModal from "../components/TermoModal";
import { IconTile, type Tom } from "../components/Icon";
import { Confetti } from "../components/ui";
import { Anel, Barras, Contador } from "../components/viz";
import type { LucideIcon } from "lucide-react";

function Tile({ icon, tom, rot, valor, sub }: { icon: LucideIcon; tom: Tom; rot: string; valor: React.ReactNode; sub?: string }) {
  return (
    <div className="tile">
      <IconTile icon={icon} tom={tom} size={36} />
      <div className="tile__rot">{rot}</div>
      <div className="tile__val">{valor}</div>
      {sub && <div className="tile__sub">{sub}</div>}
    </div>
  );
}
const Sk = () => <span className="skel skel--txt" />;

export default function Inicio() {
  const { conta } = useConta();
  const liberado = (useLocation().state as { liberado?: boolean } | null)?.liberado;
  const { dados, erro } = usePainel();
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [termo, setTermo] = useState(false);

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);
  useEffect(() => {
    if (!conta || conta.termo_em) return;
    let visto = false;
    try { visto = sessionStorage.getItem("termo_pop") === "1"; sessionStorage.setItem("termo_pop", "1"); } catch { /* sem storage */ }
    if (visto) return;
    const t = setTimeout(() => setTermo(true), liberado ? 3500 : 1500);
    return () => clearTimeout(t);
  }, [conta, liberado]);

  const ult = dados ? ultimaContagem(dados) : null;
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  const saud = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Shell titulo="Início">
      {liberado && <Confetti />}
      <div className="hello-big">
        <span className="muted">{saud},</span>
        <h2>{(conta?.nome || "criador").split(" ")[0]}</h2>
      </div>

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

      <div className="grid-home">
        <section className="card meta-card">
          <div className="row between" style={{ width: "100%" }}>
            <span className="card__t"><Target size={17} /> Meta do dia</span>
            {ult && <span className="chip">{ult.date === hojeSP() ? "hoje" : `contagem de ${ddmm(ult.date)}`}</span>}
          </div>
          {dados ? <Anel valor={ult?.videos ?? 0} meta={dados.params.meta} /> : <div className="skel" style={{ width: 168, height: 168, borderRadius: "50%" }} />}
          <p className="dim center">A contagem é atualizada pelo time ao longo do dia.</p>
        </section>

        <div className="tiles">
          <Tile icon={Film} tom="violet" rot="Vídeos no ciclo" valor={dados ? <Contador valor={dados.my.total} /> : <Sk />} sub={dados?.cycle.label} />
          <Tile icon={CalendarCheck} tom="green" rot="Dias perfeitos" valor={dados ? <Contador valor={dados.my.perfect} /> : <Sk />} sub={`meta de ${dados?.params.meta ?? 30} por dia`} />
          <Tile icon={Flame} tom="red" rot="Melhor sequência" valor={dados ? <><Contador valor={dados.my.streak} /><small>dias</small></> : <Sk />} />
          <Tile icon={Ticket} tom="yellow" rot="Tickets" valor={dados ? <Contador valor={dados.my.tickets} /> : <Sk />} sub="perfeitos × sequência" />
        </div>
      </div>

      {dados && dados.incentivo.diasRestantes > 0 && !dados.pagamento?.pago && (
        <div className="incentivo">
          <div>
            <span>Complete os <b>{dados.incentivo.diasRestantes} dias</b> que faltam e receba até</span>
            <strong><Contador valor={dados.incentivo.potencial} formato={BRL} /></strong>
          </div>
          <Link to="/carteira" className="icon-btn" aria-label="Carteira"><ChevronRight size={18} /></Link>
        </div>
      )}

      {dados && dados.my.days.length > 0 && (
        <section className="card" style={{ marginTop: 12 }}>
          <span className="card__t"><ChartColumn size={17} /> Seu ciclo dia a dia</span>
          <Barras dias={dados.my.days} meta={dados.params.meta} />
        </section>
      )}
      {erro && <div className="alert" style={{ marginTop: 12 }}>{erro}</div>}

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
