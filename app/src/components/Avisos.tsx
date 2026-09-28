import { useNavigate } from "react-router-dom";
import { ArrowRight, Megaphone, PartyPopper, Siren, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { Aviso, TomAviso } from "../lib/api";
import { useAvisos } from "../lib/avisos";
import { IconTile, type Tom } from "./Icon";
import Portal from "./Portal";

export const TONS: Record<TomAviso, { icon: LucideIcon; tom: Tom; rot: string }> = {
  info: { icon: Megaphone, tom: "violet", rot: "Informativo" },
  sucesso: { icon: PartyPopper, tom: "green", rot: "Novidade" },
  alerta: { icon: TriangleAlert, tom: "yellow", rot: "Atenção" },
  urgente: { icon: Siren, tom: "red", rot: "Urgente" },
};

// Botão de ação: rota interna (/carteira) navega no app; link externo abre em outra aba.
export function useAbrirCta() {
  const nav = useNavigate();
  const { marcar } = useAvisos();
  return (a: Pick<Aviso, "id" | "cta_url">) => {
    marcar(a.id, true);
    if (!a.cta_url) return;
    if (a.cta_url.startsWith("/")) nav(a.cta_url); else window.open(a.cta_url, "_blank", "noopener");
  };
}

// Visual do pop-up, reaproveitado na prévia do admin.
export function CartaoPopup({ a, onFechar, onCta }: { a: Pick<Aviso, "titulo" | "corpo" | "tom" | "cta_texto" | "cta_url">; onFechar?: () => void; onCta?: () => void }) {
  const t = TONS[a.tom];
  return (
    <div className={"aviso-pop aviso-pop--" + a.tom}>
      <div className="aviso-pop__top">
        <IconTile icon={t.icon} tom={t.tom} size={48} />
        {onFechar && <button className="icon-btn" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>}
      </div>
      <span className="eyebrow" style={{ color: `var(--t-${t.tom})` }}>{t.rot}</span>
      <h2 className="aviso-pop__t">{a.titulo || "Título do aviso"}</h2>
      {a.corpo && <p className="aviso-pop__c">{a.corpo}</p>}
      <div className="stack" style={{ gap: 8, marginTop: 6 }}>
        {a.cta_texto && a.cta_url && <button className="btn" onClick={onCta}>{a.cta_texto} <ArrowRight size={18} /></button>}
        <button className={"btn " + (a.cta_texto && a.cta_url ? "btn--ghost" : "")} onClick={onFechar}>Entendi</button>
      </div>
    </div>
  );
}

// Pop-up: mostra o aviso mais recente ainda não lido, um de cada vez.
export function AvisoPopup() {
  const { avisos, marcar } = useAvisos();
  const abrir = useAbrirCta();
  const a = avisos.find((x) => x.tipo === "popup" && !x.lido);
  if (!a) return null;
  return (
    <Portal>
      <div className="modal modal--center" onClick={(e) => e.target === e.currentTarget && marcar(a.id)}>
        <div className="modal__sheet" role="dialog" aria-modal="true" style={{ padding: 0 }}>
          <CartaoPopup a={a} onFechar={() => marcar(a.id)} onCta={() => abrir(a)} />
        </div>
      </div>
    </Portal>
  );
}

// Visual da faixa, reaproveitado na prévia do admin.
export function CartaoFaixa({ a, onFechar, onCta }: { a: Pick<Aviso, "titulo" | "corpo" | "tom" | "cta_texto" | "cta_url">; onFechar?: () => void; onCta?: () => void }) {
  const t = TONS[a.tom];
  return (
    <div className={"faixa faixa--" + a.tom}>
      <IconTile icon={t.icon} tom={t.tom} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{a.titulo || "Título do aviso"}</b>
        {a.corpo && <span>{a.corpo}</span>}
        {a.cta_texto && a.cta_url && <button className="faixa__cta" onClick={onCta}>{a.cta_texto} <ArrowRight size={14} /></button>}
      </div>
      {onFechar && <button className="faixa__x" onClick={onFechar} aria-label="Dispensar"><X size={16} /></button>}
    </div>
  );
}

// Faixas aparecem no Início e na página pra onde o botão delas leva (ex.: NF na Carteira).
export function AvisoFaixas({ pagina }: { pagina: string }) {
  const { avisos, marcar } = useAvisos();
  const abrir = useAbrirCta();
  const faixas = avisos.filter((x) => x.tipo === "faixa" && !x.lido && (pagina === "/" || x.cta_url === pagina));
  if (!faixas.length) return null;
  return (
    <div className="stack" style={{ gap: 8, marginBottom: 14 }}>
      {faixas.map((a) => <CartaoFaixa key={a.id} a={a} onFechar={() => marcar(a.id)} onCta={() => abrir(a)} />)}
    </div>
  );
}
