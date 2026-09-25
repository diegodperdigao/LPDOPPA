import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { api } from "./lib/api";
import { passoAtual, useConta } from "./lib/conta";
import Entrar from "./pages/Entrar";
import Inicio from "./pages/Inicio";
import Roteiros from "./pages/Roteiros";
import { Aprender, Carteira, Comunidade, Perfil, Temporada } from "./pages/Secundarias";
import AdminRoteiros from "./pages/admin/AdminRoteiros";
import Regras from "./pages/onboarding/Regras";
import CriarPerfis from "./pages/onboarding/CriarPerfis";
import Vincular from "./pages/onboarding/Vincular";
import Grupo from "./pages/onboarding/Grupo";
import OrientPerfil from "./pages/onboarding/OrientPerfil";
import OrientProducao from "./pages/onboarding/OrientProducao";

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
    grupo: !!conta.perfis_em,
    perfil: !!conta.grupo_em,
    producao: !!conta.orient_perfil_em && !conta.orient_producao_em,
  };
  if (!passo || !liberado[passo]) return <Navigate to={atual === "pronto" ? "/" : `/onboarding/${atual}`} replace />;
  switch (passo) {
    case "regras": return <Regras />;
    case "criar": return <CriarPerfis />;
    case "vincular": return <Vincular />;
    case "grupo": return <Grupo />;
    case "perfil": return <OrientPerfil />;
    case "producao": return <OrientProducao />;
  }
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
    return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}><img src="/doppa-eye.png" alt="" width={64} style={{ animation: "bob 1.4s infinite" }} /></div>;
  }
  const p = (el: React.ReactNode, admin?: boolean) => <Protegida admin={admin}>{el}</Protegida>;
  return (
    <>
      {api.modo === "demo" && <div className="demo-flag">MODO DEMO · dados só neste navegador</div>}
      <Routes>
        <Route path="/entrar" element={conta ? <Navigate to="/" replace /> : <Entrar />} />
        <Route path="/onboarding/:passo?" element={<Onboarding />} />
        <Route path="/" element={p(<Inicio />)} />
        <Route path="/roteiros" element={p(<Roteiros />)} />
        <Route path="/carteira" element={p(<Carteira />)} />
        <Route path="/temporada" element={p(<Temporada />)} />
        <Route path="/aprender" element={p(<Aprender />)} />
        <Route path="/comunidade" element={p(<Comunidade />)} />
        <Route path="/perfil" element={p(<Perfil />)} />
        <Route path="/admin/roteiros" element={p(<AdminRoteiros />, true)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
