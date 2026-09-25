import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEGMENTOS } from "../../content";
import type { Segmento } from "../../lib/api";
import { Phone, type TelaIg } from "../../components/Phone";
import { Check, Dock } from "../../components/ui";
import Layout from "./Layout";

type Slide = { tela: TelaIg; titulo: (s: Seg) => React.ReactNode; texto: (s: Seg) => React.ReactNode; pro?: boolean };
type Seg = (typeof SEGMENTOS)[Segmento];

const SLIDES: Slide[] = [
  { tela: "trocar", titulo: () => "No seu Instagram, toque no seu @ lá em cima", texto: () => <>e depois em <b>Adicionar conta do Instagram</b>.</> },
  { tela: "adicionar", titulo: () => <>Toque em <b>Criar nova conta</b></>, texto: () => "Nada de usar o perfil pessoal: esse é só pra Doppa." },
  { tela: "usuario", titulo: (s) => <>Escolha um @ que combine com {s.nome}</>, texto: (s) => <>Exemplo: <b>@{s.exemploUser}</b>. Termine o cadastro normalmente.</> },
  { tela: "menu", titulo: () => <>Abra o menu ☰ e vá em <b>Tipo de conta e ferramentas</b></>, texto: () => "Fica na parte “Para profissionais”.", pro: true },
  { tela: "tipo", titulo: () => <>Toque em <b>Mudar para conta profissional</b></>, texto: () => "É de graça e leva 1 minuto.", pro: true },
  { tela: "categoria", titulo: () => <>Escolha <b>Criador de conteúdo</b></>, texto: () => "Não escolha Empresa. Depois é só ir avançando.", pro: true },
  { tela: "pronto", titulo: () => <>Apareceu “Painel profissional”? ✅</>, texto: (s) => `Então seu perfil de ${s.nome} está certinho!`, pro: true },
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

  return (
    <Layout passo="criar">
      <div className="center">
                <h1 className="h-display h1">Crie <span className="grad-text">2 perfis novos</span></h1>
        <p className="muted" style={{ margin: "8px 0 16px" }}>
          Um pra <b style={{ color: "var(--text)" }}>Esportes ⚽</b> e outro pra <b style={{ color: "var(--text)" }}>Notícias/Variedades 📰</b>.
          Separados do seu perfil pessoal.
        </p>
      </div>

      <div className="pro-alert" style={{ marginBottom: 18 }}>
        <div className="pro-alert__ico">💼</div>
        <div>
          <b>Os 2 perfis precisam ser PROFISSIONAIS</b>
          <span>Tipo “Criador de conteúdo”. Perfil pessoal não aparece nas nossas contagens e você não recebe pelos vídeos.</span>
        </div>
      </div>

      <div className="seg-tabs" style={{ marginBottom: 18 }}>
        {(["esp", "cas"] as Segmento[]).map((k) => (
          <button key={k} className={seg === k ? "on" : ""} onClick={() => trocarSeg(k)}>
            {SEGMENTOS[k].emoji} {SEGMENTOS[k].curto} {feitos[k] ? "✅" : ""}
          </button>
        ))}
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
        <div key={`${seg}-${i}`} className="ob-body"><Phone tela={slide.tela} usuario={s.exemploUser} nome={s.exemploNome} emoji={s.emoji} /></div>
        <div className="slide-cap">
          <div className="num">{i + 1}</div>
          <b>{slide.titulo(s)}</b> 
          <span>{slide.texto(s)}</span>
          {slide.pro && <div style={{ marginTop: 8 }}><span className="chip chip--yellow">💼 Conta profissional</span></div>}
        </div>
        <div className="dots">{SLIDES.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        <div className="slide-nav">
          <button className="btn btn--ghost btn--sm" onClick={() => ir(-1)} disabled={i === 0} aria-label="Voltar">←</button>
          {ultimo ? (
            <Check on={feitos[seg]} onToggle={() => {
              const novo = { ...feitos, [seg]: !feitos[seg] };
              setFeitos(novo);
              if (!feitos[seg] && seg === "esp" && !novo.cas) setTimeout(() => trocarSeg("cas"), 450);
            }}>
              Criei meu perfil de {s.nome} como <b>profissional</b>
            </Check>
          ) : (
            <button className="btn btn--sm" style={{ width: "100%" }} onClick={() => ir(1)}>Próximo →</button>
          )}
        </div>
      </div>

      <Dock>
        <button className="btn" disabled={!feitos.esp || !feitos.cas} onClick={() => nav("/onboarding/vincular")}>
          {feitos.esp && feitos.cas ? "Criei os dois! Vincular perfis →" : `Falta criar: ${!feitos.esp ? "Esportes" : ""}${!feitos.esp && !feitos.cas ? " e " : ""}${!feitos.cas ? "Notícias" : ""}`}
        </button>
      </Dock>
    </Layout>
  );
}
