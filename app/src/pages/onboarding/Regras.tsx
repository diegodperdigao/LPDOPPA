import { useState } from "react";
import { ArrowRight, Clapperboard, FileSignature, Megaphone, Smartphone, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { MISSOES } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile, type Tom } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout from "./Layout";

// Tudo deve ser feito; as seções mostram a ordem de prioridade.
const COMECO: { icon: LucideIcon; tom: Tom; t: string }[] = [
  { icon: Smartphone, tom: "violet", t: "Crie 2 perfis profissionais no Instagram e vincule aqui" },
  { icon: UserRound, tom: "pink", t: "Ajuste os perfis" },
  { icon: Clapperboard, tom: "yellow", t: "Grave e poste os vídeos do dia!" },
];

const IMPORTANTES: { icon: LucideIcon; tom: Tom; t: string }[] = [
  { icon: FileSignature, tom: "green", t: "Termo de adesão" },
  { icon: Wallet, tom: "blue", t: "Orientações para pagamentos" },
  { icon: Megaphone, tom: "pink", t: "Detalhes sobre a campanha" },
];

export default function Regras() {
  const { conta, recarregar } = useConta();
  const [salvando, setSalvando] = useState(false);
  const primeiroNome = (conta?.nome || "").split(" ")[0];

  async function seguir() {
    setSalvando(true);
    try { await api.marcarEtapa("regras"); await recarregar(); } finally { setSalvando(false); }
  }

  return (
    <Layout passo="regras">
      <div className="ob-head">
        <img src="/mascote.webp" alt="" style={{ width: 112, margin: "0 auto 4px" }} />
        <h1 className="h-display h1">Boas-vindas{primeiroNome ? `, ${primeiroNome}` : ""}!</h1>
      </div>

      <section className="card">
        <div className="ob-bloco__t"><span className="eyebrow">Pra começar</span></div>
        <ol className="fluxo fluxo--curto">
          {COMECO.map((f, i) => (
            <li key={f.t} style={{ animationDelay: `${i * 70}ms` }}>
              <IconTile icon={f.icon} tom={f.tom} size={40} />
              <div><b>{f.t}</b></div>
            </li>
          ))}
        </ol>
      </section>

      <div className="ob-bloco">
        <div className="ob-bloco__t"><span className="eyebrow" style={{ color: "var(--t-cyan)" }}>Logo em seguida</span></div>
        <div className="missoes">
          {MISSOES.map((m) => (
            <div key={m.k} className="missao">
              <IconTile icon={m.icon} tom={m.tom} size={34} />
              <div><b>{m.t}</b></div>
            </div>
          ))}
        </div>
      </div>

      <div className="ob-bloco">
        <div className="ob-bloco__t"><span className="eyebrow" style={{ color: "var(--t-green)" }}>Passos importantes</span></div>
        <div className="missoes">
          {IMPORTANTES.map((m) => (
            <div key={m.t} className="missao">
              <IconTile icon={m.icon} tom={m.tom} size={34} />
              <div><b>{m.t}</b></div>
            </div>
          ))}
        </div>
      </div>

      <Dock>
        <p className="ob-dica">Toque em <b>Começar</b> e a gente te mostra como fazer cada passo.</p>
        <button className="btn" disabled={salvando} onClick={seguir}>Começar <ArrowRight size={18} /></button>
      </Dock>
    </Layout>
  );
}
