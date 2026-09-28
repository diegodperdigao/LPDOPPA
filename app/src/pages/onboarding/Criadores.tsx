import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { CRIADORES_DESTAQUE, SEGMENTOS } from "../../content";
import { api } from "../../lib/api";
import { igUrl } from "../../lib/ig";
import { useConta } from "../../lib/conta";
import { IconTile, InstagramLogo } from "../../components/Icon";
import { Dock } from "../../components/ui";
import Layout, { Cabeca } from "./Layout";

// Missão: ver perfis de quem já cria com a Doppa, pra pegar referência.
export default function Criadores() {
  const { recarregar } = useConta();
  const nav = useNavigate();
  const [vistos, setVistos] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  async function concluir() {
    setSalvando(true);
    try {
      await api.marcarEtapa("criadores");
      await recarregar();
      nav("/", { replace: true });
    } finally { setSalvando(false); }
  }

  return (
    <Layout passo="criadores">
      <Cabeca icone={<IconTile icon={Sparkles} tom="violet" size={52} />} titulo="Quem já cria com a Doppa">
        Dá uma olhada em como esses perfis postam. É a melhor referência pra começar.
      </Cabeca>

      <div className="missoes">
        {CRIADORES_DESTAQUE.map((c) => {
          const S = SEGMENTOS[c.segmento];
          return (
            <a key={c.ig} className={"missao" + (vistos.has(c.ig) ? " vista" : "")} href={igUrl(c.ig)} target="_blank" rel="noopener"
              onClick={() => setVistos((v) => new Set(v).add(c.ig))}>
              <IconTile icon={S.icon} tom={S.tom} size={40} />
              <div>
                <b>@{c.ig}</b>
                <span>{S.curto} · {c.frase}</span>
              </div>
              {vistos.has(c.ig) ? <span className="missao__ok"><Check size={15} strokeWidth={2.6} /></span> : <InstagramLogo size={18} />}
            </a>
          );
        })}
      </div>
      <p className="dim center" style={{ marginTop: 14, fontSize: 13 }}><ArrowUpRight size={13} style={{ verticalAlign: -2 }} /> Toque pra abrir no Instagram</p>

      <Dock>
        <button className="btn" disabled={vistos.size === 0 || salvando} onClick={concluir}>
          {vistos.size ? <><Check size={18} /> Concluir</> : "Abra pelo menos um perfil"}
        </button>
      </Dock>
    </Layout>
  );
}
