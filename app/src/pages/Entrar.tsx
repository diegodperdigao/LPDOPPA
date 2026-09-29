import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { api, ErroApp } from "../lib/api";
import { useConta } from "../lib/conta";

export default function Entrar() {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [fase, setFase] = useState<"email" | "codigo">("email");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { recarregar } = useConta();
  const nav = useNavigate();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      await api.enviarCodigo(email.trim().toLowerCase());
      setFase("codigo");
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra enviar agora. Tenta de novo.");
    } finally { setEnviando(false); }
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      await api.verificarCodigo(email.trim().toLowerCase(), codigo);
      await recarregar();
      nav("/", { replace: true });
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra entrar agora. Tenta de novo.");
    } finally { setEnviando(false); }
  }

  return (
    <main className="wrap entrar">
      <img src="/doppa-logo.webp" alt="DOPPA" className="entrar__logo" />
      <div className="entrar__card">
        {fase === "email" ? (
          <form className="stack" onSubmit={enviar}>
            <div>
              <h1 className="entrar__t">Entrar na Doppa</h1>
              <p className="muted">Use o mesmo e-mail do seu cadastro. A gente manda um código de acesso.</p>
            </div>
            <div className="input-wrap">
              <span className="at"><Mail size={18} strokeWidth={1.9} /></span>
              <input type="email" required autoComplete="email" inputMode="email" placeholder="seu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {erro && <div className="alert">{erro}</div>}
            <button className="btn" disabled={enviando || !email.includes("@")}>{enviando ? "Enviando…" : "Receber código"}</button>
          </form>
        ) : (
          <form className="stack" onSubmit={verificar}>
            <div>
              <h1 className="entrar__t">Confira seu e-mail</h1>
              <p className="muted">Digite o código de 6 números que mandamos para <b style={{ color: "var(--text)", fontWeight: 600 }}>{email}</b>, ou toque no link do e-mail.</p>
            </div>
            <div className="input-wrap">
              <input className="code-input" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} />
            </div>
            {erro && <div className="alert">{erro}</div>}
            <button className="btn" disabled={enviando || codigo.length !== 6}>{enviando ? "Entrando…" : "Entrar"}</button>
            <button type="button" className="link-btn" style={{ alignSelf: "center" }} onClick={() => { setFase("email"); setCodigo(""); setErro(""); }}>
              <ArrowLeft size={15} /> Trocar e-mail ou reenviar
            </button>
          </form>
        )}
      </div>
      {api.modo === "demo" && <p className="dim center" style={{ marginTop: 16 }}>Modo demo: qualquer e-mail e qualquer código de 6 números.</p>}
    </main>
  );
}
