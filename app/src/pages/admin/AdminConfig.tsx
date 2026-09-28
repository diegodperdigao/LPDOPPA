import { useEffect, useState } from "react";
import { api, ErroApp } from "../../lib/api";
import { useConta } from "../../lib/conta";
import { Link2, MessagesSquare } from "lucide-react";
import Shell from "../../components/Shell";

export default function AdminConfig() {
  const { recarregar } = useConta();
  const [grupo, setGrupo] = useState("");
  const [estado, setEstado] = useState<"" | "salvando" | "ok">("");
  const [erro, setErro] = useState("");

  useEffect(() => { api.adminConfig().then((c) => setGrupo(c.grupo_whatsapp ?? "")).catch((e) => setErro(e.message)); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEstado("salvando");
    try {
      await api.adminConfigSalvar("grupo_whatsapp", grupo.trim());
      await recarregar();
      setEstado("ok");
      setTimeout(() => setEstado(""), 2000);
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra salvar.");
      setEstado("");
    }
  }

  return (
    <Shell titulo="Configurações">
      <form className="card stack" onSubmit={salvar}>
        <span className="card__t"><MessagesSquare size={17} /> Grupo do WhatsApp dos membros ativos</span>
        <p className="muted" style={{ fontSize: 14 }}>Aparece no passo 4 do onboarding e na aba Comunidade, só pra quem já vinculou os perfis. Trocou o link? É só colar o novo aqui.</p>
        <div className="input-wrap">
          <span className="at"><Link2 size={17} /></span>
          <input type="url" required placeholder="https://chat.whatsapp.com/..." value={grupo} onChange={(e) => setGrupo(e.target.value)} />
        </div>
        {erro && <div className="alert">{erro}</div>}
        <button className={"btn" + (estado === "ok" ? " btn--green" : "")} disabled={estado === "salvando"}>
          {estado === "salvando" ? "Salvando…" : estado === "ok" ? "Salvo" : "Salvar link"}
        </button>
      </form>
    </Shell>
  );
}
