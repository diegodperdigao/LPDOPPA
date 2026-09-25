import { Link, useNavigate } from "react-router-dom";
import { PRODUCAO, SEGMENTOS, WHATSAPP_SUPORTE } from "../content";
import { api } from "../lib/api";
import { useConta } from "../lib/conta";
import { igUrl } from "../lib/ig";
import BottomNav from "../components/BottomNav";

function Pagina({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="wrap">
      <header className="app-top">
        <h1 className="h-display h2">{titulo}</h1>
        <img src="/doppa-logo.webp" alt="DOPPA" style={{ height: 24, width: "auto" }} />
      </header>
      <div className="stack">{children}</div>
      <div className="bnav-space" />
      <BottomNav />
    </main>
  );
}

export function Carteira() {
  return (
    <Pagina titulo="Carteira">
      <div className="empty"><div>💰</div><b style={{ color: "var(--text)" }}>Em breve aqui</b><br />Saldo do ciclo, meta do dia, checklist fiscal e envio de NF.</div>
    </Pagina>
  );
}

export function Aprender() {
  return (
    <Pagina titulo="Aprender">
      {PRODUCAO.map((d) => (
        <section className="guide" key={d.titulo}>
          <div className="guide__head"><div className="guide__num" style={{ fontSize: 20 }}>{d.icone}</div><b>{d.titulo}</b></div>
          <div className="guide__body"><ol className="steps-mini">{d.passos.map((p) => <li key={p}>{p}</li>)}</ol></div>
        </section>
      ))}
      <Link className="btn btn--ghost" to="/onboarding/perfil">Rever orientações de perfil</Link>
    </Pagina>
  );
}

export function Mais() {
  const { conta, recarregar } = useConta();
  const nav = useNavigate();
  return (
    <Pagina titulo="Mais">
      <div className="card stack">
        <b>Meus perfis</b>
        {(["esp", "cas"] as const).map((k) => {
          const h = k === "esp" ? conta?.ig_esp : conta?.ig_cas;
          return (
            <div className="row" key={k}>
              <span style={{ fontSize: 22 }}>{SEGMENTOS[k].emoji}</span>
              <span style={{ flex: 1 }}>{SEGMENTOS[k].nome}<br />{h ? <a href={igUrl(h)} target="_blank" rel="noopener">@{h}</a> : <span className="dim">não vinculado</span>}</span>
            </div>
          );
        })}
        <Link className="btn btn--ghost btn--sm" to="/onboarding/vincular">Trocar perfis</Link>
      </div>
      <a className="btn btn--green" href={WHATSAPP_SUPORTE} target="_blank" rel="noopener">💬 Falar com o suporte</a>
      <button className="btn btn--ghost" onClick={async () => { await api.sair(); await recarregar(); nav("/entrar"); }}>Sair</button>
      <p className="dim center">{conta?.email}</p>
    </Pagina>
  );
}
