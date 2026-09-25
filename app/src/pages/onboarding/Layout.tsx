import { PASSOS, type Passo } from "../../lib/conta";

const NOMES: Record<Passo, string> = {
  regras: "Boas-vindas",
  criar: "Crie seus perfis",
  vincular: "Vincule seus perfis",
  grupo: "Grupo dos criadores",
  perfil: "Monte seu perfil",
  producao: "Como gravar",
};

export default function Layout({ passo, children }: { passo: Passo; children: React.ReactNode }) {
  const i = PASSOS.indexOf(passo);
  const pct = ((i + 0.5) / PASSOS.length) * 100;
  return (
    <main className="wrap">
      <header className="ob-top">
        <div className="ob-top__row">
          <img className="ob-logo" src="/doppa-logo.webp" alt="DOPPA" />
          <span className="ob-step">Passo {i + 1} de {PASSOS.length} · {NOMES[passo]}</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </header>
      <div className="ob-body" key={passo}>{children}</div>
    </main>
  );
}
