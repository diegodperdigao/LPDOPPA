import { useState } from "react";
import { ArrowRight, Clapperboard, FileSignature, Smartphone, UserRound, type LucideIcon } from "lucide-react";
import { MISSOES } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile, type Tom } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout from "./Layout";

// Tudo deve ser feito, nesta ordem de prioridade.
const FLUXO: { icon: LucideIcon; tom: Tom; t: string; d: string }[] = [
  { icon: Smartphone, tom: "violet", t: "Crie 2 perfis novos no Instagram e vincule aqui", d: "Conta profissional (Criador de conteúdo): um de Esportes e um de Notícias." },
  { icon: UserRound, tom: "pink", t: "Ajuste os perfis", d: "Bio, link e legenda seguindo as nossas orientações." },
  { icon: Clapperboard, tom: "yellow", t: "Grave e poste os vídeos do dia!", d: "Os roteiros chegam prontos no app, todos os dias." },
  ...MISSOES.map(({ icon, tom, t, d }) => ({ icon, tom, t, d })),
  { icon: FileSignature, tom: "green", t: "Assine o termo de adesão", d: "Depois de começar. É o que libera o seu pagamento." },
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

      <ol className="fluxo">
        {FLUXO.map((f, i) => (
          <li key={f.t} style={{ animationDelay: `${i * 60}ms` }}>
            <IconTile icon={f.icon} tom={f.tom} size={40} />
            <div><b>{f.t}</b><span>{f.d}</span></div>
          </li>
        ))}
      </ol>

      <Dock>
        <button className="btn" disabled={salvando} onClick={seguir}>Começar <ArrowRight size={18} /></button>
      </Dock>
    </Layout>
  );
}
