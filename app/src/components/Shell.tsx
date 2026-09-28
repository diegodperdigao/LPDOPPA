import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, BookOpen, Flag, Search, Megaphone, Clapperboard, FilePenLine, House, Receipt, LogOut, Menu, MessagesSquare, Settings, Trophy, UserRound, Users, Wallet, type LucideIcon } from "lucide-react";
import { api } from "../lib/api";
import { useConta } from "../lib/conta";
import SeletorTema, { BotaoTema } from "./SeletorTema";
import Busca from "./Busca";
import { AvisoFaixas, AvisoPopup } from "./Avisos";
import { useAvisos } from "../lib/avisos";
import "./Shell.css";

type Item = { to: string; icon: LucideIcon; nome: string; badge?: string };
type Grupo = { titulo: string; itens: Item[]; admin?: boolean };

const GRUPOS: Grupo[] = [
  { titulo: "Criar", itens: [
    { to: "/", icon: House, nome: "Início" },
    { to: "/roteiros", icon: Clapperboard, nome: "Roteiros" },
    { to: "/campanha", icon: Flag, nome: "Campanha" },
    { to: "/aprender", icon: BookOpen, nome: "Aprender" },
  ] },
  { titulo: "Ganhos", itens: [
    { to: "/carteira", icon: Wallet, nome: "Carteira" },
    { to: "/temporada", icon: Trophy, nome: "Temporada", badge: "Em breve" },
  ] },
  { titulo: "Comunidade", itens: [
    { to: "/avisos", icon: Bell, nome: "Avisos" },
    { to: "/comunidade", icon: MessagesSquare, nome: "Grupo e suporte" },
  ] },
  { titulo: "Conta", itens: [
    { to: "/perfil", icon: UserRound, nome: "Meus perfis" },
  ] },
  { titulo: "Admin", admin: true, itens: [
    { to: "/admin/avisos", icon: Megaphone, nome: "Enviar avisos" },
    { to: "/admin/criadores", icon: Users, nome: "Criadores" },
    { to: "/admin/roteiros", icon: FilePenLine, nome: "Publicar roteiros" },
    { to: "/admin/campanhas", icon: Flag, nome: "Campanhas" },
    { to: "/admin/notas", icon: Receipt, nome: "Notas fiscais" },
    { to: "/admin/config", icon: Settings, nome: "Configurações" },
  ] },
];

const ABAS: Item[] = [
  { to: "/", icon: House, nome: "Início" },
  { to: "/roteiros", icon: Clapperboard, nome: "Roteiros" },
  { to: "/carteira", icon: Wallet, nome: "Carteira" },
];

export function Avatar({ nome, size = 36 }: { nome: string; size?: number }) {
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>{(nome || "?").trim().charAt(0).toUpperCase()}</div>;
}

function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const { conta, recarregar } = useConta();
  const { naoLidos } = useAvisos();
  const nav = useNavigate();
  const admin = conta?.papel === "admin";
  return (
    <div className="side__inner">
      <div className="side__logo"><img src="/doppa-logo.webp" alt="DOPPA" /></div>
      <div className="side__me">
        <Avatar nome={conta?.nome ?? ""} size={38} />
        <div style={{ minWidth: 0 }}>
          <b>{conta?.nome || "Criador"}</b>
          <span>{[conta?.ig_esp, conta?.ig_cas].filter(Boolean).map((h) => "@" + h).join(" · ") || conta?.email}</span>
        </div>
      </div>
      <nav className="side__nav" aria-label="Menu">
        {GRUPOS.filter((g) => !g.admin || admin).map((g) => (
          <div key={g.titulo} className="side__grp">
            <div className="side__grp-t">{g.titulo}</div>
            {g.itens.map(({ to, icon: I, nome, badge }) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={onNavegar} className={({ isActive }) => "side__link" + (isActive ? " on" : "")}>
                <I size={19} strokeWidth={1.9} />
                <span style={{ flex: 1 }}>{nome}</span>
                {badge && <span className="side__badge">{badge}</span>}
                {to === "/avisos" && naoLidos > 0 && <span className="count" style={{ background: "var(--red)", color: "#fff" }}>{naoLidos}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <SeletorTema />
      <button className="side__sair" onClick={async () => { await api.sair(); await recarregar(); nav("/entrar"); }}>
        <LogOut size={18} strokeWidth={1.9} /> Sair
      </button>
    </div>
  );
}

export default function Shell({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState(false);
  const { pathname, state } = useLocation();
  // Logo depois do onboarding o Início abre o pop-up do ciclo: aviso em pop-up espera a próxima visita.
  const recemLiberado = !!(state as { liberado?: boolean } | null)?.liberado;
  const { conta } = useConta();
  const { naoLidos } = useAvisos();
  const toque = useRef<number | null>(null);

  useEffect(() => { setAberto(false); window.scrollTo(0, 0); }, [pathname]);
  // Atalhos da busca: Ctrl/Cmd+K ou "/".
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !digitando)) { e.preventDefault(); setBusca(true); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  const paginas = GRUPOS.filter((g) => !g.admin || conta?.papel === "admin").flatMap((g) => g.itens);
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
          <button className="topbar__menu" onClick={() => setAberto(true)} aria-label="Abrir menu"><Menu size={20} strokeWidth={1.9} /></button>
          <h1 className="topbar__t">{titulo}</h1>
          <div className="topbar__acao row" style={{ gap: 8 }}>
            {acao}
            <button className="icon-btn" onClick={() => setBusca(true)} aria-label="Pesquisar"><Search size={18} strokeWidth={1.9} /></button>
            <BotaoTema />
            <NavLink to="/avisos" className="icon-btn sino" aria-label={`Avisos${naoLidos ? `: ${naoLidos} novos` : ""}`}>
              <Bell size={18} strokeWidth={1.9} />
              {naoLidos > 0 && <span className="sino__n">{naoLidos}</span>}
            </NavLink>
            {!acao && <Avatar nome={conta?.nome ?? ""} size={34} />}
          </div>
        </header>
        <main className="main__body" key={pathname}><AvisoFaixas pagina={pathname} />{children}</main>
        <div className="tabs-space" />
      </div>

      {!recemLiberado && <AvisoPopup />}
      {busca && <Busca paginas={paginas} onFechar={() => setBusca(false)} />}
      <nav className="tabs" aria-label="Atalhos">
        {ABAS.map(({ to, icon: I, nome }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "on" : "")}>
            <I size={21} strokeWidth={1.9} />{nome}
          </NavLink>
        ))}
        <button onClick={() => setAberto(true)}><Menu size={21} strokeWidth={1.9} />Menu</button>
      </nav>
    </div>
  );
}
