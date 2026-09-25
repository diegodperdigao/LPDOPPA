import { NavLink } from "react-router-dom";

const ITENS = [
  { to: "/", ico: "🎬", nome: "Roteiros" },
  { to: "/carteira", ico: "💰", nome: "Carteira" },
  { to: "/aprender", ico: "📚", nome: "Aprender" },
  { to: "/mais", ico: "☰", nome: "Mais" },
];

export default function BottomNav() {
  return (
    <nav className="bnav" aria-label="Menu principal">
      <div className="wrap">
        {ITENS.map((i) => (
          <NavLink key={i.to} to={i.to} end className={({ isActive }) => (isActive ? "on" : "")}>
            <span aria-hidden>{i.ico}</span>{i.nome}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
