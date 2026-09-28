import { useState } from "react";
import { ArrowRight, Clapperboard, Link2, MessagesSquare, Smartphone, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile, type Tom } from "../../components/Icon";
import { Check, Dock } from "../../components/ui";
import Layout from "./Layout";

// Fluxograma do que a pessoa vai fazer (onboarding + rotina).
const FLUXO: { icon: LucideIcon; tom: Tom; t: string; d: string }[] = [
  { icon: Smartphone, tom: "violet", t: "Crie 2 perfis novos no Instagram", d: "Categoria profissional (Criador de conteúdo): um de Esportes e um de Notícias." },
  { icon: Link2, tom: "blue", t: "Vincule os perfis aqui", d: "É por eles que a gente conta os seus vídeos." },
  { icon: MessagesSquare, tom: "cyan", t: "Entre no grupo dos criadores", d: "Avisos, dúvidas e desafios, tudo no WhatsApp." },
  { icon: UserRound, tom: "pink", t: "Deixe os perfis prontos", d: "Bio, link e legenda do jeito certo." },
  { icon: Clapperboard, tom: "yellow", t: "Grave e poste os roteiros do dia", d: "Os roteiros chegam prontos: é só gravar com o celular." },
  { icon: Wallet, tom: "green", t: "Receba pelos seus vídeos", d: "Você ganha por vídeo válido, a cada ciclo." },
];

export default function Regras() {
  const { conta, recarregar } = useConta();
  const [aceito, setAceito] = useState(false);
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
        <p>Aqui na Doppa você posta <b>vídeos diários</b> e ganha por eles. Pra começar são só alguns passos rápidos:</p>
      </div>

            <ol className="fluxo">
        {FLUXO.map((f, i) => (
          <li key={f.t} style={{ animationDelay: `${i * 70}ms` }}>
            <IconTile icon={f.icon} tom={f.tom} size={40} />
            <div><b>{f.t}</b><span>{f.d}</span></div>
          </li>
        ))}
      </ol>

      <Dock>
        <Check on={aceito} onToggle={() => setAceito(!aceito)}>Tenho 18 anos ou mais</Check>
        <button className="btn" disabled={!aceito || salvando} onClick={seguir}>Começar <ArrowRight size={18} /></button>
      </Dock>
    </Layout>
  );
}
