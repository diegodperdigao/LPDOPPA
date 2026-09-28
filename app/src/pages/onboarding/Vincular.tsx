import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, AtSign, Briefcase, CircleCheck, ExternalLink } from "lucide-react";
import { SEGMENTOS } from "../../content";
import { api, ErroApp, type Segmento } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { igUrl, igValido, normalizaIg } from "../../lib/ig";
import { IconTile, InstagramLogo } from "../../components/Icon";
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
        <label htmlFor={`ig-${seg}`}><IconTile icon={s.icon} tom={s.tom} size={30} /> Instagram de {s.nome}</label>
        <div className={`input-wrap ${estado}`}>
          <span className="at"><AtSign size={17} strokeWidth={1.9} /></span>
          <input id={`ig-${seg}`} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={`${s.exemploUser} ou link do perfil`}
            value={valor} onChange={(e) => onChange(e.target.value)}
            onBlur={() => { const n = normalizaIg(valor); if (n && n !== valor) onChange(n); }} />
          {ok && <CircleCheck size={18} color="var(--green)" />}
        </div>
        <span className="hint">Digite o <b>@</b> ou cole o <b>link</b> do perfil (ex.: instagram.com/{s.exemploUser}).</span>
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
      <Cabeca icone={<span className="itile ig-grad" style={{ width: 52, height: 52, margin: "0 auto 16px" }}><InstagramLogo size={28} color="#fff" /></span>} titulo="Vincule seus Instagrams">
        Informe os <b>2 perfis do Instagram</b> que você acabou de criar. Pode ser o <b>@</b> ou o <b>link</b> do perfil.
      </Cabeca>
      <div className="stack">
        <Campo seg="esp" valor={esp} onChange={setEsp} />
        <Campo seg="cas" valor={cas} onChange={setCas} />
        {erro && <div className="alert">{erro}</div>}
      </div>
      <p className="dim center" style={{ marginTop: 14, fontSize: 13.5 }}><Briefcase size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Os dois precisam ser conta profissional. É por eles que a gente conta seus vídeos.</p>
      <Dock>
        <button className="btn" disabled={!prontos || salvando} onClick={vincular}>
          {salvando ? "Vinculando…" : <>Vincular e começar <ArrowRight size={18} /></>}
        </button>
        <button className="link-btn" style={{ alignSelf: "center" }} onClick={() => nav("/onboarding/criar")}><ArrowLeft size={15} /> Ainda não criei os perfis</button>
      </Dock>
    </Layout>
  );
}
