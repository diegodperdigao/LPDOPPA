import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, AtSign, Briefcase, CircleCheck, ExternalLink, Link2 } from "lucide-react";
import { SEGMENTOS } from "../../content";
import { api, ErroApp, type Segmento } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { igUrl, igValido, normalizaIg } from "../../lib/ig";
import { IconTile } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout, { Cabeca } from "./Layout";

function Campo({ seg, valor, onChange }: { seg: Segmento; valor: string; onChange: (v: string) => void }) {
  const s = SEGMENTOS[seg];
  const h = normalizaIg(valor);
  const ok = igValido(h);
  const estado = !valor ? "" : ok ? "ok" : "bad";
  return (
    <div className="card stack">
      <div className="field">
        <label htmlFor={`ig-${seg}`}><IconTile icon={s.icon} tom={s.tom} size={30} /> Perfil de {s.nome}</label>
        <div className={`input-wrap ${estado}`}>
          <span className="at"><AtSign size={17} strokeWidth={1.9} /></span>
          <input id={`ig-${seg}`} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={s.exemploUser}
            value={valor} onChange={(e) => onChange(e.target.value)}
            onBlur={() => { const n = normalizaIg(valor); if (n && n !== valor) onChange(n); }} />
          {ok && <CircleCheck size={18} color="var(--green)" />}
        </div>
        <span className="hint">Pode digitar o @ ou colar o link do perfil.</span>
      </div>
      {ok && (
        <div className="ig-prev">
          <div className="ig-card__av"><span><s.icon size={18} strokeWidth={1.8} /></span></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>@{h}</b>
            <a href={igUrl(h)} target="_blank" rel="noopener">Conferir no Instagram <ExternalLink size={12} /></a>
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
      nav(troca ? "/perfil" : "/onboarding/perfil", { replace: true, state: { festa: !troca } });
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra vincular agora. Tenta de novo.");
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="vincular">
      <Cabeca icone={<IconTile icon={Link2} size={52} />} titulo="Vincule seus perfis">
        É por esses @ que a gente conta seus vídeos. Vinculou, <b>já pode começar</b>.
      </Cabeca>
      <div className="stack">
        <Campo seg="esp" valor={esp} onChange={setEsp} />
        <Campo seg="cas" valor={cas} onChange={setCas} />
        {erro && <div className="alert">{erro}</div>}
      </div>
      <p className="dim center row" style={{ justifyContent: "center", marginTop: 14 }}><Briefcase size={14} /> Os dois precisam ser conta profissional.</p>
      <Dock>
        <button className="btn" disabled={!prontos || salvando} onClick={vincular}>
          {salvando ? "Vinculando…" : <>Vincular e começar <ArrowRight size={18} /></>}
        </button>
        <button className="link-btn" style={{ alignSelf: "center" }} onClick={() => nav("/onboarding/criar")}><ArrowLeft size={15} /> Ainda não criei os perfis</button>
      </Dock>
    </Layout>
  );
}
