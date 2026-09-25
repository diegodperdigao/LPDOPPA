import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <main className="wrap" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", paddingBlock: 32 }}>
      <img src="/doppa-logo.webp" alt="DOPPA" style={{ height: 44, width: "auto", margin: "0 auto 8px" }} />
      <img src="/mascote.webp" alt="" style={{ width: 150, margin: "0 auto" }} />
      <h1 className="h-display h1 center" style={{ marginTop: 8 }}>
        {fase === "email" ? <>Bora <span className="grad-text">criar?</span></> : <>Confere seu <span className="grad-text">e-mail</span></>}
      </h1>
      <p className="muted center" style={{ margin: "8px 0 24px" }}>
        {fase === "email"
          ? "Entre com o mesmo e-mail do seu cadastro."
          : <>Mandamos um código de 6 números para <b style={{ color: "var(--text)" }}>{email}</b>.</>}
      </p>

      {fase === "email" ? (
        <form className="stack" onSubmit={enviar}>
          <div className="input-wrap">
            <span className="at">✉️</span>
            <input type="email" required autoComplete="email" inputMode="email" placeholder="seu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {erro && <div className="alert">{erro}</div>}
          <button className="btn" disabled={enviando || !email.includes("@")}>{enviando ? "Enviando…" : "Receber código"}</button>
        </form>
      ) : (
        <form className="stack" onSubmit={verificar}>
          <div className="input-wrap">
            <input className="code-input" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              placeholder="••••••" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} />
          </div>
          {erro && <div className="alert">{erro}</div>}
          <button className="btn" disabled={enviando || codigo.length !== 6}>{enviando ? "Entrando…" : "Entrar"}</button>
          <button type="button" className="link-btn" onClick={() => { setFase("email"); setCodigo(""); setErro(""); }}>
            Trocar e-mail ou reenviar código
          </button>
        </form>
      )}
      {api.modo === "demo" && <p className="dim center" style={{ marginTop: 18 }}>Modo demo: qualquer e-mail e qualquer código de 6 números.</p>}
    </main>
  );
}
