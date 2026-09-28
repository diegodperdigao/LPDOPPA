import { Monitor, Moon, Sun } from "lucide-react";
import { useTema, type Tema } from "../lib/tema";

const OPCOES: { t: Tema; icon: typeof Sun; rot: string }[] = [
  { t: "auto", icon: Monitor, rot: "Sistema" },
  { t: "light", icon: Sun, rot: "Claro" },
  { t: "dark", icon: Moon, rot: "Escuro" },
];

export default function SeletorTema() {
  const [tema, setTema] = useTema();
  return (
    <div className="tema" role="radiogroup" aria-label="Tema">
      {OPCOES.map(({ t, icon: I, rot }) => (
        <button key={t} role="radio" aria-checked={tema === t} className={tema === t ? "on" : ""} onClick={() => setTema(t)} title={rot}>
          <I size={15} strokeWidth={1.9} /><span>{rot}</span>
        </button>
      ))}
    </div>
  );
}

// Botão do topo: alterna entre claro e escuro (a partir do tema que está na tela).
export function BotaoTema() {
  const [tema, setTema] = useTema();
  const escuro = tema === "dark" || (tema === "auto" && !matchMedia("(prefers-color-scheme: light)").matches);
  return (
    <button className="icon-btn" onClick={() => setTema(escuro ? "light" : "dark")} aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"} title={escuro ? "Tema claro" : "Tema escuro"}>
      {escuro ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
    </button>
  );
}
