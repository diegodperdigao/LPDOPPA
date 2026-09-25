import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { Confetti, Dock } from "../../components/ui";
import Layout from "./Layout";

const MOTIVOS = [
  { ico: "📣", t: "Aviso de roteiro novo", d: "Saiu roteiro, você fica sabendo na hora." },
  { ico: "💬", t: "Tira-dúvidas com o time", d: "Travou em algo? Pergunta ali que alguém responde." },
  { ico: "🏆", t: "Desafios e prêmios", d: "Tesouros, sorteios e torneios são anunciados no grupo." },
];

export default function Grupo() {
  const { conta, recarregar } = useConta();
  const nav = useNavigate();
  const festa = (useLocation().state as { festa?: boolean } | null)?.festa;
  const [abriu, setAbriu] = useState(!!conta?.grupo_em);
  const [salvando, setSalvando] = useState(false);
  const link = conta?.grupo_link;

  async function seguir() {
    setSalvando(true);
    try {
      await api.marcarEtapa("grupo");
      await recarregar();
      nav("/onboarding/perfil", { replace: true });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="grupo">
      {festa && <Confetti />}
      {festa && (
        <div className="card card--glow center" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <b style={{ fontSize: 18 }}>Perfis vinculados! Você já é membro ativo.</b>
        </div>
      )}
      <div className="center">
        <div className="hero-ico" style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", boxShadow: "0 20px 50px -18px rgba(37,211,102,.8)" }}>💬</div>
        <h1 className="h-display h1">Entre no <span style={{ color: "#25D366" }}>grupo</span></h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>O grupo do WhatsApp é só pra <b style={{ color: "var(--text)" }}>membros ativos</b>. É onde tudo acontece no dia a dia.</p>
      </div>

      <div className="ico-list" style={{ marginBottom: 18 }}>
        {MOTIVOS.map((m) => (
          <div className="ico-item" key={m.t}>
            <div className="ico-item__ico">{m.ico}</div>
            <div><b>{m.t}</b><span>{m.d}</span></div>
          </div>
        ))}
      </div>

      {link ? (
        <a className="wpp-card" href={link} target="_blank" rel="noopener" onClick={() => setAbriu(true)}>
          <span className="wpp-card__ico">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3ZM12 21.7c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 0 1-1.5-5.2C2.1 6.5 6.5 2.1 12 2.1c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.5-4.4 9.7-9.9 9.7Zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z"/></svg>
          </span>
          <span style={{ flex: 1 }}><b>Grupo DOPPA · Criadores</b><span>Toque pra entrar no WhatsApp</span></span>
          <span style={{ fontSize: 22 }}>↗</span>
        </a>
      ) : (
        <div className="card center muted">O link do grupo está sendo preparado. Você recebe pelo WhatsApp em breve. 😉</div>
      )}

      <Dock>
        <button className="btn btn--green" disabled={(!!link && !abriu) || salvando} onClick={seguir}>
          {abriu || !link ? "Entrei no grupo! Continuar →" : "Toque no grupo acima pra entrar"}
        </button>
      </Dock>
    </Layout>
  );
}
