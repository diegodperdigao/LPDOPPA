import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarRange, ChevronRight, Clock3, FileSignature, Flag, ListChecks } from "lucide-react";
import { MISSOES, SEGMENTOS } from "../content";
import { api, ddmm, hojeSP, type Campanha, type Roteiro } from "../lib/api";
import { campanhaAtual, dataExtenso, marcasTexto } from "../lib/campanha";
import Portal from "../components/Portal";
import { missaoFeita, useConta } from "../lib/conta";
import { useAvisos } from "../lib/avisos";
import { ultimaContagem, usePainel } from "../lib/painel";
import Shell from "../components/Shell";
import TermoModal from "../components/TermoModal";
import { IconTile } from "../components/Icon";
import { Confetti } from "../components/ui";
import { DiasGrid, HeroCiclo, Kpis } from "../components/Ciclo";

function InicioCiclo({ onFechar }: { onFechar: () => void }) {
  const nav = useNavigate();
  const [c, setC] = useState<Campanha | null | undefined>(undefined);
  useEffect(() => { api.campanhas().then((l) => setC(campanhaAtual(l))).catch(() => setC(null)); }, []);
  if (c === undefined) return null;
  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <div className="modal__sheet stack ciclo-pop" role="dialog" aria-modal="true">
          <img src="/mascote.webp" alt="" style={{ width: 96, margin: "0 auto" }} />
          {c ? (
            <>
              <span className="eyebrow center">Tudo pronto!</span>
              <h2 className="h-display center" style={{ fontSize: 30, textWrap: "balance" }}>Você está iniciando no {c.ciclo ?? "ciclo atual"}</h2>
              <p className="center muted">
                Essa campanha vai do dia <b>{dataExtenso(c.inicio)}</b>{c.fim && <> até o dia <b>{dataExtenso(c.fim)}</b></>}.
                {c.marcas.length > 0 && <> As marcas parceiras são <b>{marcasTexto(c)}</b>.</>}
              </p>
            </>
          ) : (
            <>
              <span className="eyebrow center">Tudo pronto!</span>
              <h2 className="h-display center" style={{ fontSize: 30 }}>Seus roteiros estão liberados</h2>
            </>
          )}
          <button className="btn" onClick={() => { onFechar(); nav("/roteiros"); }}>Ver roteiros de hoje <ArrowRight size={18} /></button>
          {c && <button className="btn btn--ghost" onClick={() => { onFechar(); nav("/campanha"); }}><Flag size={17} /> Detalhes da campanha</button>}
        </div>
      </div>
    </Portal>
  );
}

export default function Inicio() {
  const { conta } = useConta();
  const liberado = (useLocation().state as { liberado?: boolean } | null)?.liberado;
  const { dados, erro } = usePainel();
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [termo, setTermo] = useState(false);
  // Acabou o onboarding: abre o pop-up do ciclo/campanha em que a pessoa está entrando.
  const [boasVindas, setBoasVindas] = useState(!!liberado);
  const { avisos } = useAvisos();
  const temPopup = avisos.some((a) => a.tipo === "popup" && !a.lido);

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);
  // O termo abre sozinho só se não houver um aviso em pop-up na frente (um modal por vez).
  useEffect(() => {
    if (!conta || conta.termo_em || temPopup || liberado) return;
    let visto = false;
    try { visto = sessionStorage.getItem("termo_pop") === "1"; sessionStorage.setItem("termo_pop", "1"); } catch { /* sem storage */ }
    if (visto) return;
    const t = setTimeout(() => setTermo(true), 1500);
    return () => clearTimeout(t);
  }, [conta, liberado, temPopup]);

  const pendentes = conta ? MISSOES.filter((m) => !missaoFeita(conta, m.k)) : [];
  const feitas = MISSOES.length - pendentes.length + (conta?.termo_em ? 1 : 0);

  const ult = dados ? ultimaContagem(dados) : null;
  const handles = [
    conta?.ig_esp && { tag: "ESP", h: conta.ig_esp },
    conta?.ig_cas && { tag: "NOT", h: conta.ig_cas },
  ].filter(Boolean) as { tag: string; h: string }[];

  return (
    <Shell titulo="Início">
      {liberado && <Confetti />}

      {conta && (!conta.termo_em || pendentes.length > 0) && (
        <section className="card" style={{ marginBottom: 12 }}>
          <div className="card-h"><IconTile icon={ListChecks} tom="violet" size={30} /> Próximos passos <small>{feitas}/{MISSOES.length + 1}</small></div>
          <div className="missoes">
            {pendentes.map((m) => (
              <Link key={m.k} to={m.to} className="missao">
                <IconTile icon={m.icon} tom={m.tom} size={34} />
                <div><b>{m.t}</b><span>{m.d}</span></div>
                <ChevronRight size={18} />
              </Link>
            ))}
            {!conta.termo_em && (
              <button className="missao missao--destaque" onClick={() => setTermo(true)}>
                <IconTile icon={FileSignature} tom="yellow" size={34} />
                <div><b>Assine o termo de adesão</b><span>Seus vídeos já contam. O pagamento só sai com o termo assinado.</span></div>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>
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
      {boasVindas && <InicioCiclo onFechar={() => setBoasVindas(false)} />}
    </Shell>
  );
}
