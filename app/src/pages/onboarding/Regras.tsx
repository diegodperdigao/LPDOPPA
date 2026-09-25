import { useState } from "react";
import { REGRAS } from "../../content";
import { api } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { Check, Dock } from "../../components/ui";
import Layout from "./Layout";

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
      <div className="center">
        <img src="/mascote.webp" alt="" style={{ width: 150, margin: "4px auto 0" }} />
        <h1 className="h-display h1">Bem-vindo{primeiroNome ? `, ${primeiroNome}` : ""}! <span className="grad-text">👀</span></h1>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          Em <b style={{ color: "var(--text)" }}>5 passos rápidos</b> você sai daqui pronto pra gravar seu primeiro vídeo.
        </p>
      </div>

      <div className="card stack" style={{ marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-around", textAlign: "center" }}>
          {[["📱", "2 perfis"], ["🎬", "Roteiro pronto"], ["💸", "Pago por vídeo"]].map(([i, t]) => (
            <div key={t}><div style={{ fontSize: 34 }}>{i}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div></div>
          ))}
        </div>
      </div>

      <h2 className="h-display h2" style={{ marginBottom: 12 }}>As regras do jogo</h2>
      <div className="ico-list">
        {REGRAS.map((r) => (
          <div className="ico-item" key={r.titulo}>
            <div className="ico-item__ico">{r.icone}</div>
            <div><b>{r.titulo}</b><span>{r.texto}</span></div>
          </div>
        ))}
      </div>

      <Dock>
        <Check on={aceito} onToggle={() => setAceito(!aceito)}>Tenho 18 anos ou mais e aceito as regras</Check>
        <button className="btn" disabled={!aceito || salvando} onClick={seguir}>Bora começar →</button>
      </Dock>
    </Layout>
  );
}
