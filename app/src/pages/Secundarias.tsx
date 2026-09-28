import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Award, CalendarDays, Check, ChevronDown, Crown, FileSignature, Gift, Handshake, LifeBuoy, Link2, ListChecks,
  Mail, Scale, Smartphone, Swords, Target, Trophy, UserRound,
} from "lucide-react";
import { BIO_LINK, BIO_TEXTO, PRODUCAO, RODAPE, SEGMENTOS, WHATSAPP_SUPORTE } from "../content";
import { BRL, ddmm } from "../lib/api";
import { useConta } from "../lib/conta";
import { igUrl } from "../lib/ig";
import { usePainel } from "../lib/painel";
import Shell from "../components/Shell";
import TermoModal from "../components/TermoModal";
import { IconTile, WhatsAppLogo } from "../components/Icon";
import { CopyButton } from "../components/ui";
import { NfDoCiclo, NfModal, STATUS_NF, useNfs } from "../components/NotaFiscal";
import { Calendario, Contador } from "../components/viz";

// ---------------------------------------------------------------- Carteira
export function Carteira() {
  const { conta } = useConta();
  const [ciclo, setCiclo] = useState<string | undefined>();
  const { dados, erro, semCarteira } = usePainel(ciclo);
  const [termo, setTermo] = useState(false);
  const [nfAberta, setNfAberta] = useState(false);
  const { nfs, prazo, recarregar: recarregarNfs } = useNfs();
  const pago = dados?.pagamento?.pago;
  const nf = dados ? nfs?.find((n) => n.ciclo_start === dados.cycle.start) : undefined;

  return (
    <Shell titulo="Carteira">
      {semCarteira && <div className="card muted center">Sua carteira aparece aqui assim que seus perfis estiverem vinculados.</div>}
      {erro && <div className="alert">{erro}</div>}

      {dados && (
        <>
          {dados.cycles.length > 1 && (
            <div className="ciclos">
              {dados.cycles.slice().reverse().map((c) => (
                <button key={c.start} className={c.start === dados.cycle.start ? "on" : ""} onClick={() => setCiclo(c.start)}>
                  {c.current ? "Ciclo atual" : c.label}
                </button>
              ))}
            </div>
          )}

          <section className={"wallet-hero" + (pago ? " pago" : "")}>
            <div className="wallet-hero__top">
              <span className="row" style={{ gap: 6 }}><CalendarDays size={14} /> Ciclo {dados.cycle.label}</span>
              {pago ? <span className="chip chip--green"><Check size={12} strokeWidth={2.6} /> Pago{dados.pagamento?.pago_em ? ` em ${ddmm(dados.pagamento.pago_em)}` : ""}</span>
                : dados.cycle.isCurrent ? <span className="chip">Em andamento</span> : <span className="chip chip--yellow">Aguardando pagamento</span>}
            </div>
            {pago ? (
              <><div className="wallet-hero__lab">Pago neste ciclo</div><div className="wallet-hero__val"><Contador valor={dados.pagamento!.valor} formato={BRL} /></div></>
            ) : dados.cycle.isCurrent && dados.incentivo.diasRestantes > 0 ? (
              <><div className="wallet-hero__lab">Complete os {dados.incentivo.diasRestantes} dias que faltam e receba até</div><div className="wallet-hero__val"><Contador valor={dados.incentivo.potencial} formato={BRL} /></div></>
            ) : (
              <><div className="wallet-hero__lab">Vídeos válidos no ciclo</div><div className="wallet-hero__val"><Contador valor={dados.my.total} /></div></>
            )}
            <div className="wallet-hero__row">
              <div><b><Contador valor={dados.my.totalEsp} /></b><span><SEGMENTOS.esp.icon size={13} /> Esportes</span></div>
              <div><b><Contador valor={dados.my.totalCas} /></b><span><SEGMENTOS.cas.icon size={13} /> Notícias</span></div>
              <div><b><Contador valor={dados.my.perfect} /></b><span><Target size={13} /> Dias perfeitos</span></div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 12 }}>
            <span className="card__t"><ListChecks size={17} /> Checklist pra receber</span>
            <div className="checklist">
              <div className={"checklist__i" + (dados.atingiuMinimo ? " ok" : "")}><span>{dados.atingiuMinimo ? <Check size={14} strokeWidth={2.8} /> : 1}</span>Atingir o mínimo de R$ 150 no ciclo</div>
              <button className={"checklist__i" + (conta?.termo_em ? " ok" : "")} onClick={() => !conta?.termo_em && setTermo(true)}>
                <span>{conta?.termo_em ? <Check size={14} strokeWidth={2.8} /> : 2}</span>Termo de adesão assinado {!conta?.termo_em && <em>Assinar</em>}
              </button>
              <button className={"checklist__i" + (nf?.status === "aprovada" ? " ok" : "")} onClick={() => !dados.cycle.isCurrent && (!nf || nf.status === "recusada") && setNfAberta(true)}>
                <span>{nf?.status === "aprovada" ? <Check size={14} strokeWidth={2.8} /> : 3}</span>Nota fiscal do ciclo (MEI)
                {dados.cycle.isCurrent ? <em style={{ color: "var(--dim)" }}>Após o fechamento</em>
                  : nf ? <em style={{ color: nf.status === "recusada" ? "var(--t-red)" : nf.status === "aprovada" ? "var(--t-green)" : "var(--t-yellow)" }}>{STATUS_NF[nf.status].rot}</em>
                  : <em>Enviar</em>}
              </button>
            </div>
          </section>

          {nfs && <NfDoCiclo ciclo={dados.cycle} nf={nf} prazo={prazo} onEnviar={() => setNfAberta(true)} />}

          <section className="card" style={{ marginTop: 12 }}>
            <div className="row between"><span className="card__t"><CalendarDays size={17} /> Seus dias</span><span className="dim">meta {dados.params.meta}/dia</span></div>
            <Calendario dias={dados.my.days} meta={dados.params.meta} />
            <div className="cal-leg"><span><i className="ok" />Bateu a meta</span><span><i className="meio" />Metade ou mais</span><span><i className="pouco" />Começou</span><span><i className="zero" />Sem vídeo</span></div>
          </section>

          {(dados.premios.length > 0 || dados.mgmItens.length > 0) && (
            <div className="grid-2" style={{ marginTop: 12 }}>
              {dados.premios.length > 0 && (
                <section className="card">
                  <div className="row between"><span className="card__t"><Gift size={17} /> Prêmios</span><span className="money">{BRL(dados.premiosTotal)}</span></div>
                  <div className="lista">{dados.premios.map((p, i) => (
                    <div key={i} className="lista__i"><span>{p.origem}{p.descricao && <small>{p.descricao}</small>}</span><span className="money">{BRL(p.valor)}</span></div>
                  ))}</div>
                </section>
              )}
              {dados.mgmItens.length > 0 && (
                <section className="card">
                  <div className="row between"><span className="card__t"><Handshake size={17} /> Indicações</span><span className="money">{BRL(dados.mgmTotal)}</span></div>
                  <div className="lista">{dados.mgmItens.map((m, i) => (
                    <div key={i} className="lista__i"><span>{m.nome}<small>{m.videos} vídeos · {m.pago ? "pago" : "a receber"}</small></span><span className="money">{BRL(m.valor)}</span></div>
                  ))}</div>
                </section>
              )}
            </div>
          )}
        </>
      )}
      {!dados && !semCarteira && !erro && <div className="stack">{[220, 140, 260].map((h, i) => <div key={i} className="skel" style={{ height: h, borderRadius: 18 }} />)}</div>}
      {termo && <TermoModal onFechar={() => setTermo(false)} />}
      {nfAberta && dados && <NfModal ciclo={dados.cycle} onFechar={() => setNfAberta(false)} onEnviada={() => { setNfAberta(false); recarregarNfs(); }} />}
    </Shell>
  );
}

// ---------------------------------------------------------------- Temporada
export function Temporada() {
  const itens = [
    { icon: Target, tom: "violet" as const, t: "Missões", d: "Dia perfeito, semana perfeita, 350 views num vídeo, com progresso automático." },
    { icon: Swords, tom: "red" as const, t: "Equipes", d: "Pedra, Papel e Tesoura com placar ao vivo, sem parcial manual." },
    { icon: Award, tom: "cyan" as const, t: "Conquistas", d: "Selos que ficam no seu perfil pra sempre." },
    { icon: Crown, tom: "yellow" as const, t: "Hall da fama", d: "Fenômeno, Imparável, Constante: calculado pelos seus números." },
  ];
  return (
    <Shell titulo="Temporada">
      <section className="teaser">
        <IconTile icon={Trophy} tom="yellow" size={56} />
        <h2 className="h-display h1">Temporada em breve</h2>
        <p className="muted">Tudo que hoje é anunciado à mão vai virar jogo aqui dentro.</p>
      </section>
      <div className="grid-2" style={{ marginTop: 12 }}>
        {itens.map((i, k) => (
          <div key={i.t} className="ico-item" style={{ animation: `rise .45s ${k * 70}ms both` }}>
            <IconTile icon={i.icon} tom={i.tom} size={38} /><div><b>{i.t}</b><span>{i.d}</span></div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------- Aprender
export function Aprender() {
  const [aberto, setAberto] = useState<number | null>(0);
  return (
    <Shell titulo="Aprender">
      <div className="grid-2">
        <section className="card stack">
          <span className="card__t"><UserRound size={17} /> Bio (igual nos 2 perfis)</span>
          <div className="copy-box">{BIO_TEXTO}</div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}><CopyButton texto={BIO_TEXTO} label="Texto" /><CopyButton texto={BIO_LINK} label="Link" /></div>
        </section>
        <section className="card stack">
          <span className="card__t"><Scale size={17} /> Rodapé legal</span>
          <div className="copy-box" style={{ fontSize: 13 }}>{RODAPE}</div>
          <CopyButton texto={RODAPE} label="Copiar rodapé" />
        </section>
      </div>
      <div className="sec-t"><h3>Como gravar</h3></div>
      <div className="stack">
        {PRODUCAO.map((d, i) => (
          <section key={d.titulo} className="guide">
            <button className="guide__head" onClick={() => setAberto(aberto === i ? null : i)} aria-expanded={aberto === i}>
              <IconTile icon={d.icon} size={30} />
              <b>{d.titulo}</b>
              <ChevronDown size={18} style={{ transform: aberto === i ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {aberto === i && <div className="guide__body ob-body"><ol className="steps-mini">{d.passos.map((p) => <li key={p}>{p}</li>)}</ol></div>}
          </section>
        ))}
      </div>
      <Link className="btn btn--ghost" to="/onboarding/criar" style={{ marginTop: 16 }}><Smartphone size={18} /> Rever como criar os perfis</Link>
    </Shell>
  );
}

// ---------------------------------------------------------------- Comunidade
export function Comunidade() {
  const { conta } = useConta();
  const texto = `Oi! Sou ${conta?.nome ?? ""} (${conta?.ig_esp ? "@" + conta.ig_esp : conta?.email}) e preciso de ajuda com `;
  return (
    <Shell titulo="Comunidade">
      <div className="stack">
        {conta?.grupo_link ? (
          <a className="wpp-card" href={conta.grupo_link} target="_blank" rel="noopener">
            <span className="wpp-card__ico"><WhatsAppLogo size={26} /></span>
            <span style={{ flex: 1 }}><b>Grupo DOPPA · Criadores</b><span>Avisos de roteiro, desafios e tira-dúvidas</span></span>
            <ArrowUpRight size={20} />
          </a>
        ) : <div className="card muted center">O link do grupo ainda não foi configurado.</div>}
        <a className="wpp-card wpp-card--alt" href={`${WHATSAPP_SUPORTE}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener">
          <span className="wpp-card__ico"><LifeBuoy size={22} strokeWidth={1.9} /></span>
          <span style={{ flex: 1 }}><b>Falar com o suporte</b><span>Resposta no WhatsApp do time</span></span>
          <ArrowUpRight size={20} />
        </a>
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------- Perfil
export function Perfil() {
  const { conta } = useConta();
  const [termo, setTermo] = useState(false);
  return (
    <Shell titulo="Meus perfis">
      <div className="grid-2">
        {(["esp", "cas"] as const).map((k) => {
          const h = k === "esp" ? conta?.ig_esp : conta?.ig_cas;
          const S = SEGMENTOS[k];
          return (
            <div className="ig-card" key={k}>
              <div className="ig-card__av"><span><S.icon size={20} strokeWidth={1.8} /></span></div>
              <div style={{ minWidth: 0 }}>
                <span className="dim">{S.nome}</span>
                {h ? <a href={igUrl(h)} target="_blank" rel="noopener"><b>@{h}</b></a> : <b className="dim">Não vinculado</b>}
              </div>
            </div>
          );
        })}
      </div>
      <Link className="btn btn--ghost" to="/onboarding/vincular" style={{ marginTop: 12 }}><Link2 size={18} /> Trocar perfis</Link>

      <section className="card row between" style={{ marginTop: 12 }}>
        <span className="card__t"><FileSignature size={17} /> Termo de adesão</span>
        {conta?.termo_em
          ? <span className="chip chip--green"><Check size={12} strokeWidth={2.6} /> Assinado em {ddmm(conta.termo_em.slice(0, 10))}</span>
          : <button className="btn btn--sm" onClick={() => setTermo(true)}>Assinar agora</button>}
      </section>
      <section className="card row" style={{ marginTop: 12 }}>
        <span className="card__t" style={{ flex: 1 }}><Mail size={17} /> {conta?.email}</span>
      </section>
      {termo && <TermoModal onFechar={() => setTermo(false)} />}
    </Shell>
  );
}
