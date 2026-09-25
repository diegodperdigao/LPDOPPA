import { useState } from "react";
import { TERMO_URL, TERMO_VERSAO } from "../content";
import { api, ErroApp } from "../lib/api";
import { useConta } from "../lib/conta";
import { Check, Confetti } from "./ui";

const soDigitos = (s: string) => s.replace(/\D/g, "");
const mascaraCpf = (s: string) =>
  soDigitos(s).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export default function TermoModal({ onFechar }: { onFechar: () => void }) {
  const { conta, recarregar } = useConta();
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const valido = nome.trim().split(" ").length >= 2 && soDigitos(cpf).length === 11 && soDigitos(telefone).length >= 10 && aceite;

  async function assinar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setSalvando(true);
    try {
      await api.aceitarTermo({ nome: nome.trim(), cpf: soDigitos(cpf), cnpj: soDigitos(cnpj), telefone: soDigitos(telefone) });
      setOk(true);
      await recarregar();
    } catch (x) {
      setErro(x instanceof ErroApp ? x.message : "Não deu pra salvar agora. Tenta de novo.");
    } finally { setSalvando(false); }
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal__sheet" role="dialog" aria-modal="true" aria-labelledby="termo-t">
        <div className="grab" />
        {ok ? (
          <div className="center stack" style={{ padding: "10px 0" }}>
            <Confetti />
            <div style={{ fontSize: 56 }}>✍️</div>
            <h2 className="h-display h2" id="termo-t">Termo assinado!</h2>
            <p className="muted">Pronto: seus pagamentos estão liberados. Você recebe uma cópia por e-mail.</p>
            <button className="btn" onClick={onFechar}>Voltar aos roteiros</button>
          </div>
        ) : (
          <form className="stack" onSubmit={assinar}>
            <div className="center">
              <div style={{ fontSize: 44 }}>📝</div>
              <h2 className="h-display h2" id="termo-t">Termo de adesão</h2>
              <p className="muted" style={{ fontSize: 14 }}>Obrigatório pra <b style={{ color: "var(--text)" }}>receber seus pagamentos</b>. Leva 1 minuto.</p>
            </div>
            <div className="termo-scroll">
              <b>Resumo (versão {TERMO_VERSAO})</b><br />
              • Você cria conteúdos UGC para as campanhas indicadas pela DOPPA (3C Gaming Ltda.).<br />
              • A remuneração é por conteúdo válido, conforme as regras do ciclo.<br />
              • Não há vínculo empregatício. Pagamentos acima do mínimo exigem Nota Fiscal (MEI).<br />
              • Você cede o uso dos conteúdos para as campanhas e mantém o rodapé legal em todos eles.<br />
              <a href={TERMO_URL} target="_blank" rel="noopener">Ler o termo completo ↗</a>
            </div>
            <div className="field"><label>Nome completo</label>
              <div className="input-wrap"><input required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" /></div></div>
            <div className="field"><label>CPF</label>
              <div className="input-wrap"><input required inputMode="numeric" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} placeholder="000.000.000-00" /></div></div>
            <div className="field"><label>WhatsApp</label>
              <div className="input-wrap"><input required inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 90000-0000" autoComplete="tel" /></div></div>
            <div className="field"><label>CNPJ / MEI <span className="dim">(opcional)</span></label>
              <div className="input-wrap"><input inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="Se já tiver" /></div></div>
            <Check on={aceite} onToggle={() => setAceite(!aceite)}>Li e aceito o Termo de Adesão v{TERMO_VERSAO}</Check>
            {erro && <div className="alert">{erro}</div>}
            <button className="btn" disabled={!valido || salvando}>{salvando ? "Salvando…" : "Assinar termo ✍️"}</button>
            <button type="button" className="link-btn" onClick={onFechar}>Agora não</button>
          </form>
        )}
      </div>
    </div>
  );
}
