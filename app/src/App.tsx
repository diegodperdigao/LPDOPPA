import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { api } from "./lib/api";
import { passoAtual, useConta } from "./lib/conta";
import Entrar from "./pages/Entrar";
import Home from "./pages/Home";
import { Aprender, Carteira, Mais } from "./pages/Secundarias";
import Regras from "./pages/onboarding/Regras";
import CriarPerfis from "./pages/onboarding/CriarPerfis";
import Vincular from "./pages/onboarding/Vincular";
import OrientPerfil from "./pages/onboarding/OrientPerfil";
import OrientProducao from "./pages/onboarding/OrientProducao";

// Onboarding: a pessoa pode voltar a passos já feitos, mas nunca pular pra frente.
function Onboarding() {
  const { conta } = useConta();
  const { passo } = useParams();
  if (!conta) return <Navigate to="/entrar" replace />;
  const atual = passoAtual(conta);
  const feitos = {
    regras: true,
    criar: !!conta.regras_em,
    vincular: !!conta.regras_em,
    perfil: !!conta.perfis_em,
    producao: !!conta.orient_perfil_em,
  } as Record<string, boolean>;
  if (!passo || !feitos[passo]) return <Navigate to={atual === "pronto" ? "/" : `/onboarding/${atual}`} replace />;
  if (passo === "regras" && conta.regras_em) return <Navigate to={`/onboarding/${atual === "pronto" ? "perfil" : atual}`} replace />;
  switch (passo) {
    case "regras": return <Regras />;
    case "criar": return <CriarPerfis />;
    case "vincular": return <Vincular />;
    case "perfil": return <OrientPerfil />;
    case "producao": return atual === "pronto" ? <Navigate to="/" replace /> : <OrientProducao />;
  }
  return <Navigate to="/" replace />;
}

// Área do criador: só depois do onboarding completo.
function Protegida({ children }: { children: React.ReactNode }) {
  const { conta } = useConta();
  if (!conta) return <Navigate to="/entrar" replace />;
  const atual = passoAtual(conta);
  if (atual !== "pronto") return <Navigate to={`/onboarding/${atual}`} replace />;
  return <>{children}</>;
}

export default function App() {
  const { conta, carregando } = useConta();
  if (carregando) {
    return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}><img src="/doppa-eye.png" alt="" width={64} style={{ animation: "bob 1.4s infinite" }} /></div>;
  }
  return (
    <>
      {api.modo === "demo" && <div className="demo-flag">MODO DEMO</div>}
      <Routes>
        <Route path="/entrar" element={conta ? <Navigate to="/" replace /> : <Entrar />} />
        <Route path="/onboarding/:passo?" element={<Onboarding />} />
        <Route path="/" element={<Protegida><Home /></Protegida>} />
        <Route path="/carteira" element={<Protegida><Carteira /></Protegida>} />
        <Route path="/aprender" element={<Protegida><Aprender /></Protegida>} />
        <Route path="/mais" element={<Protegida><Mais /></Protegida>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
