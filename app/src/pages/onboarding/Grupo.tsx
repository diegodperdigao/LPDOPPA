import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Megaphone, MessageCircleQuestion, Trophy } from "lucide-react";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile, WhatsAppLogo } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout, { Cabeca } from "./Layout";

const MOTIVOS = [
  { icon: Megaphone, tom: "violet" as const, t: "Aviso de roteiro novo", d: "Saiu roteiro, você fica sabendo na hora." },
  { icon: MessageCircleQuestion, tom: "cyan" as const, t: "Tira-dúvidas com o time", d: "Travou em algo? Pergunta ali que alguém responde." },
  { icon: Trophy, tom: "yellow" as const, t: "Desafios e prêmios", d: "Tesouros, sorteios e torneios são anunciados no grupo." },
];

export default function Grupo() {
  const { conta, recarregar } = useConta();
  const nav = useNavigate();
  const [abriu, setAbriu] = useState(!!conta?.grupo_em);
  const [salvando, setSalvando] = useState(false);
  const link = conta?.grupo_link;

  async function seguir() {
    setSalvando(true);
    try {
      await api.marcarEtapa("grupo");
      await recarregar();
      nav("/", { replace: true });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="grupo">
      <Cabeca icone={<span className="itile" style={{ width: 52, height: 52, background: "#25D366", color: "#fff", margin: "0 auto 16px" }}><WhatsAppLogo size={28} /></span>} titulo="Entre no grupo">
        O grupo do WhatsApp é só pra <b>membros ativos</b>. É onde tudo acontece no dia a dia.
      </Cabeca>

      <div className="ico-list" style={{ marginBottom: 16 }}>
        {MOTIVOS.map((m) => (
          <div className="ico-item" key={m.t}>
            <IconTile icon={m.icon} tom={m.tom} size={38} />
            <div><b>{m.t}</b><span>{m.d}</span></div>
          </div>
        ))}
      </div>

      {link ? (
        <a className="wpp-card" href={link} target="_blank" rel="noopener" onClick={() => setAbriu(true)}>
          <span className="wpp-card__ico"><WhatsAppLogo size={26} /></span>
          <span style={{ flex: 1 }}><b>Grupo DOPPA · Criadores</b><span>Toque pra entrar no WhatsApp</span></span>
          <ArrowUpRight size={20} />
        </a>
      ) : (
        <div className="card center muted">O link do grupo está sendo preparado. Você recebe pelo WhatsApp em breve.</div>
      )}

      <Dock>
        <button className="btn" disabled={(!!link && !abriu) || salvando} onClick={seguir}>
          {abriu || !link ? <>Entrei no grupo, concluir <ArrowRight size={18} /></> : "Toque no grupo acima pra entrar"}
        </button>
      </Dock>
    </Layout>
  );
}
