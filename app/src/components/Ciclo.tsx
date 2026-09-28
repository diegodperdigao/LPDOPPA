import { CalendarCheck, Check, ChevronLeft, ChevronRight, Film, Flame, Ticket, type LucideIcon } from "lucide-react";
import { BRL, ddmm, type Dia, type Painel } from "../lib/api";
import { Contador } from "./viz";

// ---------- navegação entre ciclos (setas + rótulo), como na wallet ----------
export function CicloNav({ p, onMudar }: { p: Painel; onMudar: (start: string) => void }) {
  const i = p.cycles.findIndex((c) => c.start === p.cycle.start);
  const ant = p.cycles[i - 1], prox = p.cycles[i + 1];
  return (
    <div className="ciclonav">
      <button onClick={() => ant && onMudar(ant.start)} disabled={!ant} aria-label="Ciclo anterior"><ChevronLeft size={17} /></button>
      <div className="ciclonav__c"><b>{p.cycle.label}</b><span className={p.cycle.isCurrent ? "" : "fim"}>{p.cycle.isCurrent ? "Ciclo atual" : "Ciclo encerrado"}</span></div>
      <button onClick={() => prox && onMudar(prox.start)} disabled={!prox} aria-label="Próximo ciclo"><ChevronRight size={17} /></button>
    </div>
  );
}

// ---------- hero do ciclo ----------
export function HeroCiclo({ p, nome, handles, children }: { p: Painel; nome: string; handles: { tag: string; h: string }[]; children?: React.ReactNode }) {
  const pago = p.pagamento?.pago;
  let status: React.ReactNode, rot: string, val: React.ReactNode, cls = "";
  if (pago) {
    status = <span className="pill pill--ok"><Check size={13} strokeWidth={2.8} /> Pago{p.pagamento?.pago_em ? ` em ${ddmm(p.pagamento.pago_em)}` : ""}</span>;
    rot = "Pago neste ciclo"; val = <Contador valor={p.pagamento!.valor} formato={BRL} />;
  } else if (p.cycle.isCurrent) {
    status = <span className="pill">Em andamento · faltam {p.incentivo.diasRestantes} {p.incentivo.diasRestantes === 1 ? "dia" : "dias"}</span>;
    rot = "Complete os dias que faltam e receba até"; val = <>+<Contador valor={p.incentivo.potencial} formato={BRL} /></>;
  } else {
    status = <span className="pill pill--wait">Aguardando pagamento</span>;
    rot = "Vídeos válidos no ciclo"; val = <Contador valor={p.my.total} />; cls = " hero__val--num";
  }
  return (
    <section className={"hero" + (pago ? " hero--pago" : "")}>
      <div className="hero__ring" aria-hidden />
      <img className="hero__masc" src="/mascote.webp" alt="" />
      <div className="hero__in">
        <span className="hero__eyebrow">Seu ciclo · {p.cycle.label}</span>
        <h2 className="hero__nome">{nome}</h2>
        {handles.length > 0 && <div className="hero__handles">{handles.map((x) => <span key={x.tag}><i>{x.tag}</i>@{x.h}</span>)}</div>}
        {status}
        <div className="hero__lab">{rot}</div>
        <div className={"hero__val" + cls}>{val}</div>
        {children}
      </div>
    </section>
  );
}

// ---------- indicadores com barra colorida embaixo ----------
function Kpi({ icon: I, rot, valor, sub, cor }: { icon: LucideIcon; rot: string; valor: React.ReactNode; sub: string; cor: string }) {
  return (
    <div className="kpi" style={{ ["--bar" as string]: cor }}>
      <span className="kpi__k"><I size={13} strokeWidth={2.2} /> {rot}</span>
      <span className="kpi__v">{valor}</span>
      <span className="kpi__m">{sub}</span>
    </div>
  );
}
export function Kpis({ p }: { p: Painel }) {
  return (
    <div className="kpis">
      <Kpi icon={Film} rot="Vídeos" valor={<Contador valor={p.my.total} />} sub={`${p.my.totalEsp} esp · ${p.my.totalCas} not`} cor="var(--g-accent)" />
      <Kpi icon={CalendarCheck} rot="Dias perfeitos" valor={<Contador valor={p.my.perfect} />} sub={`${p.params.meta}+ vídeos no dia`} cor="var(--green)" />
      <Kpi icon={Flame} rot="Sequência" valor={<Contador valor={p.my.streak} />} sub="maior seguida" cor="var(--cyan)" />
      <Kpi icon={Ticket} rot="Tickets" valor={<Contador valor={p.my.tickets} />} sub="no sorteio em dobro" cor="linear-gradient(90deg,#7B4DFF,#EC5BD8)" />
    </div>
  );
}

// ---------- grade de dias (controle de vídeos) ----------
export function DiasGrid({ dias, meta, ultimos }: { dias: Dia[]; meta: number; ultimos?: number }) {
  const lista = ultimos ? dias.slice(-ultimos) : dias;
  const ok = dias.filter((d) => d.ok).length;
  return (
    <>
      {!ultimos && (
        <div className="prog">
          <div className="prog__bar"><i style={{ width: `${dias.length ? (ok / dias.length) * 100 : 0}%` }} /></div>
          <span><b>{ok}</b> de {dias.length} dias na meta</span>
        </div>
      )}
      <div className="dias">
        {lista.map((d, i) => {
          const cls = d.ok ? "ok" : d.videos >= meta / 2 ? "parte" : d.videos > 0 ? "pouco" : "zero";
          return (
            <div key={d.date} className={"dia " + cls} style={{ animationDelay: `${Math.min(i, 30) * 15}ms` }} title={`${ddmm(d.date)}: ${d.videos} vídeos`}>
              {d.ok && <Check className="dia__ok" size={11} strokeWidth={3} />}
              <span className="dia__d">{ddmm(d.date)}</span>
              <span className="dia__v">{d.videos}</span>
              <span className="dia__s">{d.videos ? `${d.esp}E · ${d.cas}N` : "vídeos"}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
