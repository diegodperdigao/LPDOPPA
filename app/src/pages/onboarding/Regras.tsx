import { useState } from "react";
import { ArrowRight, ScrollText, Smartphone, Wallet } from "lucide-react";
import { REGRAS } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { IconTile } from "../../components/Icon";
import { Check, Dock } from "../../components/ui";
import Layout from "./Layout";

const PILARES = [
  { icon: Smartphone, t: "2 perfis novos" },
  { icon: ScrollText, t: "Roteiro pronto" },
  { icon: Wallet, t: "Pago por vídeo" },
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
        <h1 className="h-display h1">Bem-vindo{primeiroNome ? `, ${primeiroNome}` : ""}!</h1>
        <p>Em <b>6 passos rápidos</b> você sai daqui pronto pra gravar seu primeiro vídeo.</p>
      </div>

      <div className="pilares">
        {PILARES.map(({ icon: I, t }) => (
          <div key={t}><IconTile icon={I} tom="violet" size={40} /><span>{t}</span></div>
        ))}
      </div>

      <div className="eyebrow" style={{ margin: "26px 0 10px" }}>As regras do jogo</div>
      <div className="ico-list">
        {REGRAS.map((r) => (
          <div className="ico-item" key={r.titulo}>
            <IconTile icon={r.icon} tom={r.tom} size={38} />
            <div><b>{r.titulo}</b><span>{r.texto}</span></div>
          </div>
        ))}
      </div>

      <Dock>
        <Check on={aceito} onToggle={() => setAceito(!aceito)}>Tenho 18 anos ou mais e aceito as regras</Check>
        <button className="btn" disabled={!aceito || salvando} onClick={seguir}>Começar <ArrowRight size={18} /></button>
      </Dock>
    </Layout>
  );
}
