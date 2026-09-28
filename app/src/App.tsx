import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { api } from "./lib/api";
import { DoppaEye } from "./components/Icon";
import { passoAtual, useConta } from "./lib/conta";
import { AvisosProvider } from "./lib/avisos";
import Mural from "./pages/Mural";
import AdminAvisos from "./pages/admin/AdminAvisos";
import Entrar from "./pages/Entrar";
import Inicio from "./pages/Inicio";
import Roteiros from "./pages/Roteiros";
import { Aprender, Carteira, Comunidade, Perfil, Temporada } from "./pages/Secundarias";
import AdminRoteiros from "./pages/admin/AdminRoteiros";
import AdminCriadores from "./pages/admin/AdminCriadores";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminNotas from "./pages/admin/AdminNotas";
import Regras from "./pages/onboarding/Regras";
import CriarPerfis from "./pages/onboarding/CriarPerfis";
import Vincular from "./pages/onboarding/Vincular";
import Grupo from "./pages/onboarding/Grupo";
import OrientPerfil from "./pages/onboarding/OrientPerfil";
import OrientProducao from "./pages/onboarding/OrientProducao";
import Criadores from "./pages/onboarding/Criadores";
import Campanha from "./pages/Campanha";
import AdminCampanhas from "./pages/admin/AdminCampanhas";

// Onboarding: pode voltar a passos já feitos, nunca pular pra frente.
function Onboarding() {
  const { conta } = useConta();
  const { passo } = useParams();
  if (!conta) return <Navigate to="/entrar" replace />;
  const atual = passoAtual(conta);
  const liberado: Record<string, boolean> = {
    regras: !conta.regras_em,
    criar: !!conta.regras_em,
    vincular: !!conta.regras_em,
    perfil: !!conta.perfis_em,
  };
  if (!passo || !liberado[passo]) return <Navigate to={atual === "pronto" ? "/" : `/onboarding/${atual}`} replace />;
  switch (passo) {
    case "regras": return <Regras />;
    case "criar": return <CriarPerfis />;
    case "vincular": return <Vincular />;
    case "perfil": return <OrientPerfil />;
  }
  return <Navigate to="/" replace />;
}

// Missões secundárias: telas cheias, fora do Shell, depois do passo 1.
function MissaoPag() {
  const { m } = useParams();
  if (m === "gravar") return <OrientProducao />;
  if (m === "criadores") return <Criadores />;
  if (m === "grupo") return <Grupo />;
  return <Navigate to="/" replace />;
}

// Área do criador: só depois do onboarding (admin entra direto).
function Protegida({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { conta } = useConta();
  if (!conta) return <Navigate to="/entrar" replace />;
  const ehAdmin = conta.papel === "admin";
  if (admin && !ehAdmin) return <Navigate to="/" replace />;
  const atual = passoAtual(conta);
  if (atual !== "pronto" && !ehAdmin) return <Navigate to={`/onboarding/${atual}`} replace />;
  return <>{children}</>;
}

export default function App() {
  const { conta, carregando } = useConta();
  if (carregando) {
    return <div className="loading"><DoppaEye size={56} /></div>;
  }
  const p = (el: React.ReactNode, admin?: boolean) => <Protegida admin={admin}>{el}</Protegida>;
  return (
    <>
      {api.modo === "demo" && <div className="demo-flag">Modo demonstração: os dados ficam só neste navegador</div>}
      <AvisosProvider>
      <Routes>
        <Route path="/entrar" element={conta ? <Navigate to="/" replace /> : <Entrar />} />
        <Route path="/onboarding/:passo?" element={<Onboarding />} />
        <Route path="/missao/:m" element={p(<MissaoPag />)} />
        <Route path="/" element={p(<Inicio />)} />
        <Route path="/roteiros" element={p(<Roteiros />)} />
        <Route path="/campanha" element={p(<Campanha />)} />
        <Route path="/carteira" element={p(<Carteira />)} />
        <Route path="/temporada" element={p(<Temporada />)} />
        <Route path="/aprender" element={p(<Aprender />)} />
        <Route path="/comunidade" element={p(<Comunidade />)} />
        <Route path="/perfil" element={p(<Perfil />)} />
        <Route path="/avisos" element={p(<Mural />)} />
        <Route path="/admin/avisos" element={p(<AdminAvisos />, true)} />
        <Route path="/admin/campanhas" element={p(<AdminCampanhas />, true)} />
        <Route path="/admin/roteiros" element={p(<AdminRoteiros />, true)} />
        <Route path="/admin/criadores" element={p(<AdminCriadores />, true)} />
        <Route path="/admin/config" element={p(<AdminConfig />, true)} />
        <Route path="/admin/notas" element={p(<AdminNotas />, true)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AvisosProvider>
    </>
  );
}
