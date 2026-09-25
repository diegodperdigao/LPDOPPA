import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEGMENTOS } from "../../content";
import { api, ErroApp, type Segmento } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { igUrl, igValido, normalizaIg } from "../../lib/ig";
import { Dock } from "../../components/ui";
import Layout from "./Layout";

function Campo({ seg, valor, onChange }: { seg: Segmento; valor: string; onChange: (v: string) => void }) {
  const s = SEGMENTOS[seg];
  const h = normalizaIg(valor);
  const ok = igValido(h);
  const estado = !valor ? "" : ok ? "ok" : "bad";
  return (
    <div className="card stack">
      <div className="field">
        <label htmlFor={`ig-${seg}`}><span style={{ fontSize: 24 }}>{s.emoji}</span> Perfil de {s.nome}</label>
        <div className={`input-wrap ${estado}`}>
          <span className="at">@</span>
          <input id={`ig-${seg}`} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={s.exemploUser}
            value={valor} onChange={(e) => onChange(e.target.value)}
            onBlur={() => { const n = normalizaIg(valor); if (n && n !== valor) onChange(n); }} />
          {ok && <span aria-hidden>✅</span>}
        </div>
        <span className="hint">Pode digitar o @ ou colar o link do perfil.</span>
      </div>
      {ok && (
        <div className="row" style={{ gap: 12, animation: "rise .4s both" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", padding: 2, background: "var(--g-ig)", flex: "0 0 auto" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: 20 }}>{s.emoji}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>@{h}</b>
            <a href={igUrl(h)} target="_blank" rel="noopener" style={{ fontSize: 14 }}>Conferir no Instagram ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Vincular() {
  const { conta, recarregar } = useConta();
  const nav = useNavigate();
  const [esp, setEsp] = useState(conta?.ig_esp ?? "");
  const [cas, setCas] = useState(conta?.ig_cas ?? "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const prontos = igValido(normalizaIg(esp)) && igValido(normalizaIg(cas));

  async function vincular() {
    setErro(""); setSalvando(true);
    try {
      const troca = !!conta?.perfis_em;
      await api.vincularPerfis(esp, cas);
      await recarregar();
      nav(troca ? "/mais" : "/onboarding/perfil", { replace: true, state: { festa: !troca } });
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra vincular agora. Tenta de novo.");
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="vincular">
      <div className="center">
        <div className="hero-ico">🔗</div>
        <h1 className="h-display h1">Vincule seus <span className="grad-text">perfis</span></h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>
          É por esses @ que a gente conta seus vídeos. Vinculou, <b style={{ color: "var(--text)" }}>já pode começar</b>.
        </p>
      </div>
      <div className="stack">
        <Campo seg="esp" valor={esp} onChange={setEsp} />
        <Campo seg="cas" valor={cas} onChange={setCas} />
        {erro && <div className="alert">{erro}</div>}
      </div>
      <p className="dim center" style={{ marginTop: 14 }}>💼 Lembre: os dois precisam ser conta profissional.</p>
      <Dock>
        <button className="btn btn--green" disabled={!prontos || salvando} onClick={vincular}>
          {salvando ? "Vinculando…" : "Vincular e começar 🚀"}
        </button>
        <button className="link-btn" onClick={() => nav("/onboarding/criar")}>← Ainda não criei os perfis</button>
      </Dock>
    </Layout>
  );
}
