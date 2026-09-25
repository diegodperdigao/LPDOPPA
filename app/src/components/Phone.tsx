import "./Phone.css";

export type TelaIg = "trocar" | "adicionar" | "usuario" | "menu" | "tipo" | "categoria" | "pronto" | "perfil";

interface Props {
  tela: TelaIg;
  usuario: string;
  nome: string;
  emoji: string;
  bio?: string;
  destaques?: { emoji: string; nome: string }[];
  small?: boolean;
}

function Perfil({ usuario, nome, emoji, bio, destaques, children, pro }: Omit<Props, "tela" | "small"> & { children?: React.ReactNode; pro?: boolean }) {
  return (
    <>
      <div className="ig-bar">🔒 {usuario} ▾<span className="sp" />＋ ☰</div>
      <div className="ig-body">
        <div className="row" style={{ gap: 12 }}>
          <div className="ig-avatar"><div>{emoji}</div></div>
          <div className="ig-stats"><div><b>0</b>posts</div><div><b>0</b>seguidores</div><div><b>0</b>seguindo</div></div>
        </div>
        <div className="ig-name">{nome}</div>
        {pro && <div className="ig-badge">✓ Painel profissional</div>}
        {bio && <div className="ig-bio">{bio}</div>}
        <div className="ig-btns"><div>Editar perfil</div><div>Compartilhar</div></div>
        {destaques && (
          <div className="ig-hl">{destaques.map((d) => <div key={d.nome}><i>{d.emoji}</i>{d.nome}</div>)}</div>
        )}
        <div className="ig-grid">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
        {children}
      </div>
    </>
  );
}

export function Phone(p: Props) {
  const { tela, usuario, nome, emoji } = p;
  let conteudo: React.ReactNode;

  switch (tela) {
    case "trocar":
      conteudo = (
        <Perfil usuario="seu.perfil.pessoal" nome="Você" emoji="🙂">
          <div className="ig-dim" />
          <div className="ig-sheet">
            <div className="ig-row"><span className="ic">🙂</span>seu.perfil.pessoal<span className="sp" />✓</div>
            <div className="ig-row tap"><span className="ic">＋</span>Adicionar conta do Instagram</div>
          </div>
        </Perfil>
      );
      break;
    case "adicionar":
      conteudo = (
        <div className="ig-body" style={{ justifyContent: "center", gap: 12 }}>
          <div className="ig-title">Adicionar conta</div>
          <div className="ig-row" style={{ border: "1px solid #333", borderRadius: 10, justifyContent: "center" }}>Entrar na conta existente</div>
          <div className="ig-blue tap">Criar nova conta</div>
        </div>
      );
      break;
    case "usuario":
      conteudo = (
        <div className="ig-body" style={{ gap: 12 }}>
          <div className="ig-title">Crie um nome de usuário</div>
          <div className="ig-sub">Um perfil novo, só pra Doppa</div>
          <div className="ig-row" style={{ border: "1.5px solid #0095f6", borderRadius: 10, padding: "10px" }}>{usuario}<span className="sp" />✅</div>
          <div className="ig-blue tap">Avançar</div>
        </div>
      );
      break;
    case "menu":
      conteudo = (
        <>
          <div className="ig-bar">←<span className="sp" style={{ textAlign: "center" }}>Configurações e atividade</span></div>
          <div className="ig-body">
            <div className="ig-sec">Como você usa o Instagram</div>
            <div className="ig-list">
              <div className="ig-row"><span className="ic">🔖</span>Salvos</div>
              <div className="ig-row"><span className="ic">🔔</span>Notificações</div>
              <div className="ig-sec">Para profissionais</div>
              <div className="ig-row tap"><span className="ic">📊</span>Tipo de conta e ferramentas</div>
              <div className="ig-row"><span className="ic">🔒</span>Privacidade da conta</div>
            </div>
          </div>
        </>
      );
      break;
    case "tipo":
      conteudo = (
        <>
          <div className="ig-bar">←<span className="sp" style={{ textAlign: "center" }}>Tipo de conta e ferramentas</span></div>
          <div className="ig-body">
            <div className="ig-list">
              <div className="ig-row"><span className="ic">✅</span><div>Verificação<small>Solicitar selo</small></div></div>
              <div className="ig-row tap"><span className="ic">💼</span><div>Mudar para conta profissional<small>Acesse ferramentas e estatísticas</small></div></div>
            </div>
          </div>
        </>
      );
      break;
    case "categoria":
      conteudo = (
        <div className="ig-body" style={{ gap: 10, paddingTop: 16 }}>
          <div className="ig-title">O que melhor descreve você?</div>
          <div className="ig-sub">Escolha o tipo de conta profissional</div>
          <div className="ig-choice sel tap" style={{ position: "relative" }}><span style={{ fontSize: 18 }}>🎥</span><div><b>Criador de conteúdo</b><div style={{ color: "#a8a8a8", fontSize: 9.5 }}>Figuras públicas e criadores</div></div><span className="radio" /></div>
          <div className="ig-choice"><span style={{ fontSize: 18 }}>🏪</span><div><b>Empresa</b><div style={{ color: "#a8a8a8", fontSize: 9.5 }}>Lojas e marcas</div></div><span className="radio" /></div>
          <div className="ig-blue" style={{ marginTop: "auto" }}>Avançar</div>
        </div>
      );
      break;
    case "pronto":
      conteudo = <Perfil usuario={usuario} nome={nome} emoji={emoji} pro />;
      break;
    case "perfil":
      conteudo = <Perfil usuario={usuario} nome={nome} emoji={emoji} bio={p.bio} destaques={p.destaques} pro />;
      break;
  }

  return (
    <div className={"phone" + (p.small ? " phone--sm" : "")} aria-hidden="true">
      <div className="phone__screen">
        <div className="phone__notch" />
        <div className="phone__status"><span>9:41</span><span>●●● 🔋</span></div>
        {conteudo}
      </div>
    </div>
  );
}
