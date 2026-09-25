import { useState } from "react";
import { Link } from "react-router-dom";
import { BIO_LINK, BIO_TEXTO, PRODUCAO, RODAPE, SEGMENTOS, WHATSAPP_SUPORTE } from "../content";
import { BRL, ddmm } from "../lib/api";
import { useConta } from "../lib/conta";
import { igUrl } from "../lib/ig";
import { usePainel } from "../lib/painel";
import Shell from "../components/Shell";
import TermoModal from "../components/TermoModal";
import { CopyButton } from "../components/ui";
import { Calendario, Contador } from "../components/viz";

// ---------------------------------------------------------------- Carteira
export function Carteira() {
  const { conta } = useConta();
  const [ciclo, setCiclo] = useState<string | undefined>();
  const { dados, erro, semCarteira } = usePainel(ciclo);
  const [termo, setTermo] = useState(false);
  const pago = dados?.pagamento?.pago;

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
              <span>Ciclo {dados.cycle.label}</span>
              {pago ? <span className="chip chip--green">✓ Pago{dados.pagamento?.pago_em ? ` em ${ddmm(dados.pagamento.pago_em)}` : ""}</span>
                : dados.cycle.isCurrent ? <span className="chip">em andamento</span> : <span className="chip chip--yellow">aguardando pagamento</span>}
            </div>
            {pago ? (
              <><div className="wallet-hero__lab">Pago neste ciclo</div><div className="wallet-hero__val"><Contador valor={dados.pagamento!.valor} formato={BRL} /></div></>
            ) : dados.cycle.isCurrent && dados.incentivo.diasRestantes > 0 ? (
              <><div className="wallet-hero__lab">Complete os {dados.incentivo.diasRestantes} dias que faltam e receba até</div><div className="wallet-hero__val">+<Contador valor={dados.incentivo.potencial} formato={BRL} /></div></>
            ) : (
              <><div className="wallet-hero__lab">Vídeos válidos no ciclo</div><div className="wallet-hero__val"><Contador valor={dados.my.total} /></div></>
            )}
            <div className="wallet-hero__row">
              <div><b><Contador valor={dados.my.totalEsp} /></b><span>⚽ Esportes</span></div>
              <div><b><Contador valor={dados.my.totalCas} /></b><span>📰 Notícias</span></div>
              <div><b><Contador valor={dados.my.perfect} /></b><span>✅ Dias perfeitos</span></div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <b>🧾 Checklist pra receber</b>
            <div className="checklist">
              <div className={"checklist__i" + (dados.atingiuMinimo ? " ok" : "")}><span>{dados.atingiuMinimo ? "✓" : "1"}</span>Atingir o mínimo de R$ 150 no ciclo</div>
              <button className={"checklist__i" + (conta?.termo_em ? " ok" : "")} onClick={() => !conta?.termo_em && setTermo(true)}>
                <span>{conta?.termo_em ? "✓" : "2"}</span>Termo de adesão assinado {!conta?.termo_em && <em>assinar →</em>}
              </button>
              <div className="checklist__i"><span>3</span>Nota fiscal do ciclo (MEI) <em className="dim">em breve aqui</em></div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><b>📅 Seus dias</b><span className="dim">meta {dados.params.meta}/dia</span></div>
            <Calendario dias={dados.my.days} meta={dados.params.meta} />
            <div className="cal-leg"><span><i className="ok" />bateu a meta</span><span><i className="meio" />metade+</span><span><i className="pouco" />começou</span><span><i className="zero" />sem vídeo</span></div>
          </section>

          {(dados.premios.length > 0 || dados.mgmItens.length > 0) && (
            <div className="grid-2" style={{ marginTop: 16 }}>
              {dados.premios.length > 0 && (
                <section className="card">
                  <div className="row" style={{ justifyContent: "space-between" }}><b>🎁 Prêmios</b><b className="money">{BRL(dados.premiosTotal)}</b></div>
                  <div className="lista">{dados.premios.map((p, i) => (
                    <div key={i} className="lista__i"><span><b>{p.origem}</b>{p.descricao && <small>{p.descricao}</small>}</span><span className="money">{BRL(p.valor)}</span></div>
                  ))}</div>
                </section>
              )}
              {dados.mgmItens.length > 0 && (
                <section className="card">
                  <div className="row" style={{ justifyContent: "space-between" }}><b>🤝 Indicações</b><b className="money">{BRL(dados.mgmTotal)}</b></div>
                  <div className="lista">{dados.mgmItens.map((m, i) => (
                    <div key={i} className="lista__i"><span><b>{m.nome}</b><small>{m.videos} vídeos · {m.pago ? "pago" : "a receber"}</small></span><span className="money">{BRL(m.valor)}</span></div>
                  ))}</div>
                </section>
              )}
            </div>
          )}
        </>
      )}
      {!dados && !semCarteira && !erro && <div className="stack">{[220, 140, 260].map((h, i) => <div key={i} className="skel" style={{ height: h, borderRadius: 26 }} />)}</div>}
      {termo && <TermoModal onFechar={() => setTermo(false)} />}
    </Shell>
  );
}

// ---------------------------------------------------------------- Temporada
export function Temporada() {
  const itens = [
    { ico: "🎯", t: "Missões", d: "Dia perfeito, semana perfeita, 350 views num vídeo… com progresso automático." },
    { ico: "⚔️", t: "Equipes", d: "Pedra, Papel e Tesoura com placar ao vivo, sem parcial manual." },
    { ico: "🏅", t: "Conquistas", d: "Selos que ficam no seu perfil pra sempre." },
    { ico: "👑", t: "Hall da fama", d: "Fenômeno, Imparável, Constante… calculado pelos seus números." },
  ];
  return (
    <Shell titulo="Temporada">
      <section className="teaser">
        <div className="teaser__glow" />
        <div style={{ fontSize: 64 }}>🏆</div>
        <h2 className="h-display h1">Temporada <span className="grad-text">em breve</span></h2>
        <p className="muted">Tudo que hoje é anunciado à mão vai virar jogo aqui dentro.</p>
      </section>
      <div className="grid-2" style={{ marginTop: 16 }}>
        {itens.map((i, k) => (
          <div key={i.t} className="ico-item" style={{ animation: `rise .5s ${k * 80}ms both` }}>
            <div className="ico-item__ico">{i.ico}</div><div><b>{i.t}</b><span>{i.d}</span></div>
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
          <b>👤 Bio (igual nos 2 perfis)</b>
          <div className="copy-box">{BIO_TEXTO}</div>
          <div className="row" style={{ flexWrap: "wrap" }}><CopyButton texto={BIO_TEXTO} label="Texto" /><CopyButton texto={BIO_LINK} label="Link" /></div>
        </section>
        <section className="card stack">
          <b>⚖️ Rodapé legal</b>
          <div className="copy-box" style={{ fontSize: 13 }}>{RODAPE}</div>
          <CopyButton texto={RODAPE} label="Copiar rodapé" />
        </section>
      </div>
      <h3 className="h-display h2" style={{ margin: "22px 0 12px" }}>Como gravar</h3>
      <div className="stack">
        {PRODUCAO.map((d, i) => (
          <section key={d.titulo} className="guide">
            <button className="guide__head" style={{ width: "100%", textAlign: "left" }} onClick={() => setAberto(aberto === i ? null : i)} aria-expanded={aberto === i}>
              <div className="guide__num" style={{ fontSize: 20 }}>{d.icone}</div>
              <b style={{ flex: 1 }}>{d.titulo}</b><span className="muted">{aberto === i ? "▴" : "▾"}</span>
            </button>
            {aberto === i && <div className="guide__body ob-body"><ol className="steps-mini">{d.passos.map((p) => <li key={p}>{p}</li>)}</ol></div>}
          </section>
        ))}
      </div>
      <Link className="btn btn--ghost" to="/onboarding/criar" style={{ marginTop: 16 }}>📱 Rever como criar os perfis</Link>
    </Shell>
  );
}

// ---------------------------------------------------------------- Comunidade
export function Comunidade() {
  const { conta } = useConta();
  return (
    <Shell titulo="Comunidade">
      {conta?.grupo_link ? (
        <a className="wpp-card" href={conta.grupo_link} target="_blank" rel="noopener">
          <span className="wpp-card__ico">💬</span>
          <span style={{ flex: 1 }}><b>Grupo DOPPA · Criadores</b><span>Avisos de roteiro, desafios e tira-dúvidas</span></span>
          <span style={{ fontSize: 22 }}>↗</span>
        </a>
      ) : <div className="card muted center">O link do grupo ainda não foi configurado.</div>}
      <a className="wpp-card wpp-card--alt" href={`${WHATSAPP_SUPORTE}?text=${encodeURIComponent(`Oi! Sou ${conta?.nome ?? ""} (${conta?.ig_esp ? "@" + conta.ig_esp : conta?.email}) e preciso de ajuda com `)}`} target="_blank" rel="noopener" style={{ marginTop: 12 }}>
        <span className="wpp-card__ico">🆘</span>
        <span style={{ flex: 1 }}><b>Falar com o suporte</b><span>Resposta no WhatsApp do time</span></span>
        <span style={{ fontSize: 22 }}>↗</span>
      </a>
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
          return (
            <div className="ig-card" key={k}>
              <div className="ig-card__av"><span>{SEGMENTOS[k].emoji}</span></div>
              <div style={{ minWidth: 0 }}>
                <span className="dim">{SEGMENTOS[k].nome}</span>
                {h ? <a href={igUrl(h)} target="_blank" rel="noopener"><b>@{h}</b></a> : <b className="dim">não vinculado</b>}
              </div>
            </div>
          );
        })}
      </div>
      <Link className="btn btn--ghost" to="/onboarding/vincular" style={{ marginTop: 12 }}>🔗 Trocar perfis</Link>

      <section className="card stack" style={{ marginTop: 16 }}>
        <b>📝 Termo de adesão</b>
        {conta?.termo_em
          ? <span className="chip chip--green" style={{ alignSelf: "flex-start" }}>✓ Assinado em {ddmm(conta.termo_em.slice(0, 10))}</span>
          : <button className="btn btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => setTermo(true)}>Assinar agora</button>}
      </section>
      <section className="card stack" style={{ marginTop: 16 }}>
        <b>✉️ Conta</b>
        <span className="muted">{conta?.email}</span>
      </section>
      {termo && <TermoModal onFechar={() => setTermo(false)} />}
    </Shell>
  );
}
