import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Briefcase, Smartphone } from "lucide-react";
import { PRINTS_IG, SEGMENTOS } from "../../content";
import type { Segmento } from "../../lib/api";
import { Phone, type TelaIg } from "../../components/Phone";
import { IconTile } from "../../components/Icon";
import { Check, Dock } from "../../components/ui";
import Layout, { Cabeca } from "./Layout";

type Seg = (typeof SEGMENTOS)[Segmento];
type Slide = { tela: TelaIg; titulo: (s: Seg) => React.ReactNode; texto: (s: Seg) => React.ReactNode; pro?: boolean };

const SLIDES: Slide[] = [
  { tela: "trocar", titulo: () => "No seu Instagram, toque no seu @ lá em cima", texto: () => <>Depois em <b>Adicionar conta do Instagram</b>.</> },
  { tela: "adicionar", titulo: () => "Toque em Criar nova conta", texto: () => "Nada de usar o perfil pessoal: esse é só pra Doppa." },
  { tela: "usuario", titulo: (s) => `Escolha um @ que combine com ${s.nome}`, texto: (s) => <>Exemplo: <b>@{s.exemploUser}</b>. Termine o cadastro normalmente.</> },
  { tela: "menu", titulo: () => "Abra o menu e vá em Tipo de conta e ferramentas", texto: () => "Fica na parte “Para profissionais”.", pro: true },
  { tela: "tipo", titulo: () => "Toque em Mudar para conta profissional", texto: () => "É grátis e leva 1 minuto.", pro: true },
  { tela: "categoria", titulo: () => "Escolha Criador de conteúdo", texto: () => "Não escolha Empresa. Depois é só ir avançando.", pro: true },
  { tela: "pronto", titulo: () => "Apareceu “Painel profissional”?", texto: (s) => `Então seu perfil de ${s.nome} está certo.`, pro: true },
];

export default function CriarPerfis() {
  const nav = useNavigate();
  const [seg, setSeg] = useState<Segmento>("esp");
  const [i, setI] = useState(0);
  const [feitos, setFeitos] = useState<Record<Segmento, boolean>>({ esp: false, cas: false });
  const toque = useRef<number | null>(null);
  const s = SEGMENTOS[seg];
  const slide = SLIDES[i];
  const ultimo = i === SLIDES.length - 1;

  function trocarSeg(n: Segmento) { setSeg(n); setI(0); }
  function ir(d: number) { setI((v) => Math.max(0, Math.min(SLIDES.length - 1, v + d))); }
  const faltam = (["esp", "cas"] as Segmento[]).filter((k) => !feitos[k]).map((k) => SEGMENTOS[k].curto);

  return (
    <Layout passo="criar">
      <Cabeca icone={<IconTile icon={Smartphone} size={52} />} titulo="Crie 2 perfis novos">
        Um pra <b>Esportes</b> e outro pra <b>Notícias/Variedades</b>, separados do seu perfil pessoal.
      </Cabeca>

      <div className="pro-alert" style={{ marginBottom: 18 }}>
        <IconTile icon={Briefcase} tom="yellow" size={36} />
        <div>
          <b>Os 2 perfis precisam ser profissionais</b>
          <span>Tipo “Criador de conteúdo”. Perfil pessoal não entra nas contagens e os vídeos não são pagos.</span>
        </div>
      </div>

      <div className="seg-tabs" style={{ marginBottom: 20 }}>
        {(["esp", "cas"] as Segmento[]).map((k) => {
          const S = SEGMENTOS[k];
          return (
            <button key={k} className={seg === k ? "on" : ""} onClick={() => trocarSeg(k)}>
              <S.icon size={16} strokeWidth={1.9} /> {S.curto}
              {feitos[k] && <span className="chip chip--green" style={{ padding: "1px 7px" }}>ok</span>}
            </button>
          );
        })}
      </div>

      <div
        className="slides"
        onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (toque.current === null) return;
          const dx = e.changedTouches[0].clientX - toque.current;
          if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
          toque.current = null;
        }}
      >
        <div key={`${seg}-${i}`} className="ob-body"><Phone tela={slide.tela} usuario={s.exemploUser} nome={s.exemploNome} print={PRINTS_IG[slide.tela]} /></div>
        <div className="slide-cap">
          <div className="num">{i + 1}</div>
          <b>{slide.titulo(s)}</b>
          <span>{slide.texto(s)}</span>
          {slide.pro && <div style={{ marginTop: 8 }}><span className="chip chip--yellow"><Briefcase size={12} /> Conta profissional</span></div>}
        </div>
        <div className="dots">{SLIDES.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        <div className="slide-nav">
          <button className="icon-btn" style={{ width: 50, height: 50 }} onClick={() => ir(-1)} disabled={i === 0} aria-label="Voltar"><ArrowLeft size={18} /></button>
          {ultimo ? (
            <Check on={feitos[seg]} onToggle={() => {
              const novo = { ...feitos, [seg]: !feitos[seg] };
              setFeitos(novo);
              if (!feitos[seg] && seg === "esp" && !novo.cas) setTimeout(() => trocarSeg("cas"), 450);
            }}>
              Criei o perfil profissional de {s.nome}
            </Check>
          ) : (
            <button className="btn" style={{ minHeight: 50 }} onClick={() => ir(1)}>Próximo <ArrowRight size={17} /></button>
          )}
        </div>
      </div>

      <Dock>
        <button className="btn" disabled={faltam.length > 0} onClick={() => nav("/onboarding/vincular")}>
          {faltam.length ? `Falta criar: ${faltam.join(" e ")}` : <>Vincular meus perfis <ArrowRight size={18} /></>}
        </button>
      </Dock>
    </Layout>
  );
}
