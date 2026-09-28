import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { PASSOS, type Missao, type Passo } from "../../lib/conta";

const NOMES: Record<Passo | Missao, string> = {
  regras: "Boas-vindas",
  criar: "Crie seus perfis",
  vincular: "Vincule seus perfis",
  perfil: "Ajuste seus perfis",
  gravar: "Como gravar",
  criadores: "Criadores Doppa",
  grupo: "Comunidade",
};

// Passos do onboarding mostram a barra de progresso; missões têm um "fechar" que volta pro app.
export default function Layout({ passo, children }: { passo: Passo | Missao; children: React.ReactNode }) {
  const i = PASSOS.indexOf(passo as Passo);
  const missao = i < 0;
  const pct = ((i + 0.5) / PASSOS.length) * 100;
  return (
    <main className="wrap">
      <header className="ob-top">
        <div className="ob-top__row">
          <img className="ob-logo" src="/doppa-logo.webp" alt="DOPPA" />
          <span className="ob-step">{NOMES[passo]}</span>
          {missao && <Link to="/" className="icon-btn" aria-label="Voltar ao início"><X size={18} /></Link>}
        </div>
        {!missao && (
          <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
          </div>
        )}
      </header>
      <div className="ob-body" key={passo}>{children}</div>
    </main>
  );
}

// Cabeçalho padrão dos passos: ícone, título e subtítulo.
export function Cabeca({ icone, titulo, children }: { icone: React.ReactNode; titulo: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="ob-head">
      {icone}
      <h1 className="h-display h1">{titulo}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
