import { useState } from "react";
import { ArrowRight, Clapperboard, FileSignature, Smartphone, UserRound, type LucideIcon } from "lucide-react";
import { MISSOES } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile, type Tom } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout from "./Layout";

// Tudo deve ser feito; as seções mostram a ordem de prioridade.
const COMECO: { icon: LucideIcon; tom: Tom; t: string; d: string }[] = [
  { icon: Smartphone, tom: "violet", t: "Crie 2 perfis novos no Instagram e vincule aqui", d: "Conta profissional (Criador de conteúdo): um de Esportes e um de Notícias." },
  { icon: UserRound, tom: "pink", t: "Ajuste os perfis", d: "Bio, link e legenda seguindo as nossas orientações." },
  { icon: Clapperboard, tom: "yellow", t: "Grave e poste os vídeos do dia!", d: "Os roteiros chegam prontos no app, todos os dias." },
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
        <p>Aqui na Doppa você posta <b>vídeos diários</b> e ganha por eles. São só alguns passos rápidos, nesta ordem:</p>
      </div>

      <section className="card">
        <div className="ob-bloco__t"><span className="eyebrow">Pra começar</span></div>
        <ol className="fluxo">
          {COMECO.map((f, i) => (
            <li key={f.t} style={{ animationDelay: `${i * 70}ms` }}>
              <IconTile icon={f.icon} tom={f.tom} size={40} />
              <div><b>{f.t}</b><span>{f.d}</span></div>
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
        <div className="ob-bloco__t"><span className="eyebrow" style={{ color: "var(--t-green)" }}>Pra receber</span></div>
        <div className="missao">
          <IconTile icon={FileSignature} tom="green" size={34} />
          <div><b>Assine o termo de adesão</b><span>Depois que começar a postar. É o que libera o seu pagamento.</span></div>
        </div>
      </div>

      <Dock>
        <button className="btn" disabled={salvando} onClick={seguir}>Começar <ArrowRight size={18} /></button>
      </Dock>
    </Layout>
  );
}
