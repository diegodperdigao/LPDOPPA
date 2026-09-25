import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useConta } from "../lib/conta";
import "./Shell.css";

type Item = { to: string; ico: string; nome: string; badge?: string };
type Grupo = { titulo: string; itens: Item[]; admin?: boolean };

const GRUPOS: Grupo[] = [
  { titulo: "Criar", itens: [
    { to: "/", ico: "🏠", nome: "Início" },
    { to: "/roteiros", ico: "🎬", nome: "Roteiros" },
    { to: "/aprender", ico: "📚", nome: "Aprender" },
  ] },
  { titulo: "Ganhos", itens: [
    { to: "/carteira", ico: "💰", nome: "Carteira" },
    { to: "/temporada", ico: "🏆", nome: "Temporada", badge: "em breve" },
  ] },
  { titulo: "Comunidade", itens: [
    { to: "/comunidade", ico: "💬", nome: "Grupo e suporte" },
  ] },
  { titulo: "Conta", itens: [
    { to: "/perfil", ico: "👤", nome: "Meus perfis" },
  ] },
  { titulo: "Admin", admin: true, itens: [
    { to: "/admin/roteiros", ico: "📝", nome: "Publicar roteiros" },
  ] },
];

const ABAS: Item[] = [
  { to: "/", ico: "🏠", nome: "Início" },
  { to: "/roteiros", ico: "🎬", nome: "Roteiros" },
  { to: "/carteira", ico: "💰", nome: "Carteira" },
];

function Avatar({ nome }: { nome: string }) {
  return <div className="avatar" aria-hidden>{(nome || "?").trim().charAt(0).toUpperCase()}</div>;
}

function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const { conta, recarregar } = useConta();
  const nav = useNavigate();
  const admin = conta?.papel === "admin";
  return (
    <div className="side__inner">
      <div className="side__logo"><img src="/doppa-logo.webp" alt="DOPPA" /></div>
      <div className="side__me">
        <Avatar nome={conta?.nome ?? ""} />
        <div style={{ minWidth: 0 }}>
          <b>{conta?.nome || "Criador"}</b>
          <span>{[conta?.ig_esp, conta?.ig_cas].filter(Boolean).map((h) => "@" + h).join(" · ") || conta?.email}</span>
        </div>
      </div>
      <nav className="side__nav" aria-label="Menu">
        {GRUPOS.filter((g) => !g.admin || admin).map((g) => (
          <div key={g.titulo} className="side__grp">
            <div className="side__grp-t">{g.titulo}</div>
            {g.itens.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to === "/"} onClick={onNavegar} className={({ isActive }) => "side__link" + (isActive ? " on" : "")}>
                <span className="side__ico">{i.ico}</span>
                <span style={{ flex: 1 }}>{i.nome}</span>
                {i.badge && <span className="side__badge">{i.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <button className="side__sair" onClick={async () => { await api.sair(); await recarregar(); nav("/entrar"); }}>↩ Sair</button>
    </div>
  );
}

export default function Shell({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  const { conta } = useConta();
  const toque = useRef<number | null>(null);

  useEffect(() => { setAberto(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);

  return (
    <div className="shell">
      <aside className="side side--fixed"><Sidebar /></aside>

      <div className={"drawer" + (aberto ? " open" : "")} aria-hidden={!aberto}>
        <div className="drawer__bg" onClick={() => setAberto(false)} />
        <aside
          className="side side--drawer"
          onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (toque.current !== null && e.changedTouches[0].clientX - toque.current < -50) setAberto(false); toque.current = null; }}
        >
          <Sidebar onNavegar={() => setAberto(false)} />
        </aside>
      </div>

      <div className="main">
        <header className="topbar">
          <button className="topbar__menu" onClick={() => setAberto(true)} aria-label="Abrir menu">
            <span /><span /><span />
          </button>
          <h1 className="topbar__t">{titulo}</h1>
          <div className="topbar__acao">{acao ?? <Avatar nome={conta?.nome ?? ""} />}</div>
        </header>
        <main className="main__body" key={pathname}>{children}</main>
        <div className="tabs-space" />
      </div>

      <nav className="tabs" aria-label="Atalhos">
        {ABAS.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === "/"} className={({ isActive }) => (isActive ? "on" : "")}>
            <span>{i.ico}</span>{i.nome}
          </NavLink>
        ))}
        <button onClick={() => setAberto(true)}><span>☰</span>Menu</button>
      </nav>
    </div>
  );
}
