import { BadgeCheck, Bell, Bookmark, Briefcase, ChartColumn, ChevronDown, ChevronLeft, CircleCheck, Link2, Lock, Menu, Plus, SquarePlus, Store, UserRound, Video } from "lucide-react";
import { InstagramLogo } from "./Icon";
import "./Phone.css";

export type TelaIg = "trocar" | "adicionar" | "usuario" | "menu" | "tipo" | "categoria" | "pronto" | "perfil";

interface Props {
  tela: TelaIg;
  usuario: string;
  nome: string;
  bio?: string;
  link?: string;
  destaques?: string[];
  small?: boolean;
  print?: { src: string; alvo?: { x: number; y: number; w: number; h: number } };
}

const I = { size: 15, strokeWidth: 1.9 } as const;

function Perfil({ usuario, nome, bio, link, destaques, pro, children }: Omit<Props, "tela" | "small"> & { pro?: boolean; children?: React.ReactNode }) {
  return (
    <>
      <div className="ig-bar"><Lock size={12} strokeWidth={2.2} /> {usuario} <ChevronDown size={13} /><span className="sp" /><SquarePlus {...I} /><Menu {...I} /></div>
      <div className="ig-body">
        <div className="ig-head">
          <div className="ig-avatar"><div><UserRound size={22} strokeWidth={1.6} /></div></div>
          <div className="ig-stats"><div><b>0</b>posts</div><div><b>0</b>seguidores</div><div><b>0</b>seguindo</div></div>
        </div>
        <div className="ig-name">{nome}</div>
        {pro && <div className="ig-badge"><ChartColumn size={11} strokeWidth={2.2} /> Painel profissional</div>}
        {bio && <div className="ig-bio">{bio}</div>}
        {link && <div className="ig-link"><Link2 size={11} strokeWidth={2.2} /> {link.replace(/^https?:\/\//, "")}</div>}
        <div className="ig-btns"><div>Editar perfil</div><div>Compartilhar perfil</div></div>
        {destaques && (
          <div className="ig-hl">{destaques.map((d) => <div key={d}><i /><span>{d}</span></div>)}</div>
        )}
        <div className="ig-grid">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
        {children}
      </div>
    </>
  );
}

export function Phone(p: Props) {
  const { tela, usuario, nome } = p;
  let conteudo: React.ReactNode;

  // Print real do Instagram, quando tiver: a imagem ocupa a tela do celular e o alvo marca o toque.
  if (p.print) {
    const a = p.print.alvo;
    return (
      <div className={"phone phone--print" + (p.small ? " phone--sm" : "")} aria-hidden="true">
        <div className="phone__screen">
          <img className="phone__print" src={p.print.src} alt="" />
          {a && <span className="phone__alvo" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }} />}
        </div>
      </div>
    );
  }

  switch (tela) {
    case "trocar":
      conteudo = (
        <Perfil usuario="seu.perfil" nome="Você">
          <div className="ig-dim" />
          <div className="ig-sheet">
            <div className="ig-row"><span className="ig-mini" /> seu.perfil<span className="sp" /><CircleCheck size={15} color="#0095f6" /></div>
            <div className="ig-row tap"><span className="ig-plus"><Plus size={13} strokeWidth={2.4} /></span> Adicionar conta do Instagram</div>
          </div>
        </Perfil>
      );
      break;
    case "adicionar":
      conteudo = (
        <div className="ig-body ig-center">
          <div style={{ margin: "0 auto 6px" }}><InstagramLogo size={40} color="#fff" /></div>
          <div className="ig-title">Adicionar conta</div>
          <div className="ig-outline">Entrar na conta existente</div>
          <div className="ig-blue tap">Criar nova conta</div>
        </div>
      );
      break;
    case "usuario":
      conteudo = (
        <div className="ig-body" style={{ gap: 12, paddingTop: 18 }}>
          <div className="ig-title" style={{ textAlign: "left" }}>Crie um nome de usuário</div>
          <div className="ig-sub" style={{ textAlign: "left" }}>Um perfil novo, só pra Doppa.</div>
          <div className="ig-input">{usuario}<span className="sp" /><CircleCheck size={15} color="#58c322" /></div>
          <div className="ig-blue tap">Avançar</div>
        </div>
      );
      break;
    case "menu":
      conteudo = (
        <>
          <div className="ig-bar"><ChevronLeft {...I} /><span className="sp ig-bar__t">Configurações e atividade</span></div>
          <div className="ig-body">
            <div className="ig-sec">Como você usa o Instagram</div>
            <div className="ig-row"><Bookmark {...I} /> Salvos</div>
            <div className="ig-row"><Bell {...I} /> Notificações</div>
            <div className="ig-sec">Para profissionais</div>
            <div className="ig-row tap"><ChartColumn {...I} /> Tipo de conta e ferramentas</div>
            <div className="ig-row"><Lock {...I} /> Privacidade da conta</div>
          </div>
        </>
      );
      break;
    case "tipo":
      conteudo = (
        <>
          <div className="ig-bar"><ChevronLeft {...I} /><span className="sp ig-bar__t">Tipo de conta e ferramentas</span></div>
          <div className="ig-body">
            <div className="ig-row"><BadgeCheck {...I} /><div>Verificação<small>Solicitar selo</small></div></div>
            <div className="ig-row tap"><Briefcase {...I} /><div>Mudar para conta profissional<small>Ferramentas e estatísticas</small></div></div>
          </div>
        </>
      );
      break;
    case "categoria":
      conteudo = (
        <div className="ig-body" style={{ gap: 10, paddingTop: 18 }}>
          <div className="ig-title">O que melhor descreve você?</div>
          <div className="ig-sub">Tipo de conta profissional</div>
          <div className="ig-choice sel tap"><Video {...I} /><div><b>Criador de conteúdo</b><small>Figuras públicas e criadores</small></div><span className="radio" /></div>
          <div className="ig-choice"><Store {...I} /><div><b>Empresa</b><small>Lojas e marcas</small></div><span className="radio" /></div>
          <div className="ig-blue" style={{ marginTop: "auto" }}>Avançar</div>
        </div>
      );
      break;
    case "pronto":
      conteudo = <Perfil usuario={usuario} nome={nome} pro />;
      break;
    case "perfil":
      conteudo = <Perfil usuario={usuario} nome={nome} bio={p.bio} link={p.link} destaques={p.destaques} pro />;
      break;
  }

  return (
    <div className={"phone" + (p.small ? " phone--sm" : "")} aria-hidden="true">
      <div className="phone__screen">
        <div className="phone__notch" />
        <div className="phone__status"><span>9:41</span><span className="phone__sig"><i /><i /><i /><b /></span></div>
        {conteudo}
      </div>
    </div>
  );
}
