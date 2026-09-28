import { useEffect, useMemo, useState } from "react";
import { api, ddmm, type ContaAdmin, type Funil } from "../../lib/api";
import { igUrl } from "../../lib/ig";
import Shell from "../../components/Shell";
import { Contador } from "../../components/viz";

type Etapa = "regras" | "perfis" | "grupo" | "orient" | "produzir" | "ativo";

const ETAPAS: { k: Etapa; nome: string; ico: string; msg: (n: string) => string }[] = [
  { k: "regras", nome: "Não começou", ico: "🚪", msg: (n) => `Oi ${n}! Vi que você criou sua conta na Doppa mas ainda não começou o passo a passo. Leva 5 minutinhos: https://app.doppa.com.br` },
  { k: "perfis", nome: "Sem perfis vinculados", ico: "📱", msg: (n) => `Oi ${n}! Falta só criar e vincular seus 2 perfis profissionais na Doppa pra você começar. Precisa de ajuda? https://app.doppa.com.br` },
  { k: "grupo", nome: "Fora do grupo", ico: "💬", msg: (n) => `Oi ${n}! Seus perfis já estão vinculados 🎉 Entra no grupo dos criadores pra receber os roteiros: https://app.doppa.com.br` },
  { k: "orient", nome: "Faltam orientações", ico: "📚", msg: (n) => `Oi ${n}! Falta pouco: termina as orientações de perfil e produção no app que seus roteiros liberam: https://app.doppa.com.br` },
  { k: "produzir", nome: "Pronto, sem vídeo (7d)", ico: "😴", msg: (n) => `Oi ${n}! Seus roteiros estão liberados no app e ainda não vimos vídeos seus essa semana. Bora gravar o primeiro? https://app.doppa.com.br` },
  { k: "ativo", nome: "Produzindo", ico: "🔥", msg: (n) => `Oi ${n}! Mandando bem nos vídeos 🔥` },
];

function etapaDe(c: ContaAdmin): Etapa {
  if (!c.regras_em) return "regras";
  if (!c.perfis_em) return "perfis";
  if (!c.grupo_em) return "grupo";
  if (!c.orient_producao_em) return "orient";
  return c.videos_7d > 0 ? "ativo" : "produzir";
}
function desde(c: ContaAdmin) {
  const ult = [c.orient_producao_em, c.orient_perfil_em, c.grupo_em, c.perfis_em, c.regras_em, c.criado_em].find(Boolean)!;
  const d = Math.floor((Date.now() - new Date(ult).getTime()) / 864e5);
  return d <= 0 ? "hoje" : d === 1 ? "há 1 dia" : `há ${d} dias`;
}
function wpp(tel: string | null, texto: string) {
  let t = (tel || "").replace(/\D/g, "");
  if (!t) return null;
  if (t.length <= 11) t = "55" + t;
  return `https://wa.me/${t}?text=${encodeURIComponent(texto)}`;
}

export default function AdminCriadores() {
  const [dados, setDados] = useState<Funil | null>(null);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<"app" | "legado">("app");
  const [filtro, setFiltro] = useState<Etapa | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => { api.adminCriadores().then(setDados).catch((e) => setErro(e.message)); }, []);

  const contas = dados?.contas ?? [];
  const porEtapa = useMemo(() => {
    const m = new Map<Etapa, number>();
    for (const c of contas) m.set(etapaDe(c), (m.get(etapaDe(c)) ?? 0) + 1);
    return m;
  }, [contas]);
  // funil acumulado: quantos passaram de cada ponto
  const chegaram = (i: number) => ETAPAS.slice(i).reduce((s, e) => s + (porEtapa.get(e.k) ?? 0), 0);

  const q = busca.trim().toLowerCase();
  const casa = (...xs: (string | null | undefined)[]) => !q || xs.some((x) => (x || "").toLowerCase().includes(q));
  const lista = contas.filter((c) => (!filtro || etapaDe(c) === filtro) && casa(c.nome, c.email, c.ig_esp, c.ig_cas));
  const legado = (dados?.legado ?? []).filter((l) => casa(l.nome, l.ig_esp, l.ig_cas));

  return (
    <Shell titulo="Criadores">
      <div className="seg-tabs" style={{ marginBottom: 16 }}>
        <button className={aba === "app" ? "on" : ""} onClick={() => setAba("app")}>📲 No app <span className="count">{contas.length}</span></button>
        <button className={aba === "legado" ? "on" : ""} onClick={() => setAba("legado")}>🗂️ Só na carteira <span className="count">{dados?.legado.length ?? 0}</span></button>
      </div>
      {erro && <div className="alert">{erro}</div>}

      {aba === "app" && (
        <section className="card funil">
          <div className="row" style={{ justifyContent: "space-between" }}><b>🧭 Funil do onboarding</b>{filtro && <button className="link-btn" style={{ padding: 0 }} onClick={() => setFiltro(null)}>limpar filtro ✕</button>}</div>
          {ETAPAS.map((e, i) => {
            const n = porEtapa.get(e.k) ?? 0, passou = chegaram(i);
            const pct = contas.length ? (passou / contas.length) * 100 : 0;
            return (
              <button key={e.k} className={"funil__i" + (filtro === e.k ? " on" : "")} onClick={() => setFiltro(filtro === e.k ? null : e.k)}>
                <span className="funil__ico">{e.ico}</span>
                <span className="funil__txt"><b>{e.nome}</b><span className="funil__bar"><i style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }} /></span></span>
                <span className="funil__n"><Contador valor={n} /></span>
              </button>
            );
          })}
        </section>
      )}

      <div className="input-wrap" style={{ margin: "16px 0 12px" }}>
        <span className="at">🔎</span>
        <input placeholder="Buscar por nome, e-mail ou @" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {!dados && !erro && <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 96, borderRadius: 20 }} />)}</div>}

      {aba === "app" && dados && (
        <div className="adm-grid">
          {lista.length === 0 && <div className="empty"><div>🫥</div>Ninguém por aqui.</div>}
          {lista.map((c, i) => {
            const et = ETAPAS.find((e) => e.k === etapaDe(c))!;
            const nome = (c.nome || c.email).split(" ")[0];
            const link = wpp(c.telefone, et.msg(nome));
            return (
              <article key={c.id} className="pessoa" style={{ animation: `rise .4s ${Math.min(i, 12) * 40}ms both` }}>
                <div className="pessoa__top">
                  <div className="avatar">{(c.nome || c.email).charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{c.nome || "Sem nome"} {c.papel === "admin" && <span className="chip">admin</span>}</b>
                    <span>{c.email}</span>
                  </div>
                  <span className={"chip" + (et.k === "ativo" ? " chip--green" : et.k === "produzir" ? " chip--red" : " chip--yellow")}>{et.ico} {et.nome}</span>
                </div>
                <div className="pessoa__meta">
                  {c.ig_esp && <a href={igUrl(c.ig_esp)} target="_blank" rel="noopener">⚽ @{c.ig_esp}</a>}
                  {c.ig_cas && <a href={igUrl(c.ig_cas)} target="_blank" rel="noopener">📰 @{c.ig_cas}</a>}
                  <span>🎬 {c.videos_7d} vídeos/7d</span>
                  {c.ultimo_video && <span>último {ddmm(c.ultimo_video)}</span>}
                  <span>{c.termo_em ? "📝 termo ok" : "📝 sem termo"}</span>
                  {c.btag && <span>🏷️ {c.btag}</span>}
                  <span className="dim">etapa {desde(c)}</span>
                </div>
                {link && et.k !== "ativo" && <a className="btn btn--sm btn--green" href={link} target="_blank" rel="noopener">💬 Chamar no WhatsApp</a>}
              </article>
            );
          })}
        </div>
      )}

      {aba === "legado" && dados && (
        <>
          <p className="dim" style={{ marginBottom: 12 }}>Criadores da carteira que ainda não criaram conta no app. Quando entrarem e vincularem o mesmo @, a produção deles é reconhecida automaticamente.</p>
          <div className="adm-grid">
            {legado.map((l) => (
              <article key={l.id} className="pessoa">
                <div className="pessoa__top">
                  <div className="avatar" style={{ background: "var(--surface-2)" }}>{l.nome.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><b>{l.nome}</b><span>{l.status}</span></div>
                  <span className={"chip" + (l.videos_7d > 0 ? " chip--green" : "")}>🎬 {l.videos_7d}/7d</span>
                </div>
                <div className="pessoa__meta">
                  {l.ig_esp && <a href={igUrl(l.ig_esp)} target="_blank" rel="noopener">⚽ @{l.ig_esp}</a>}
                  {l.ig_cas && <a href={igUrl(l.ig_cas)} target="_blank" rel="noopener">📰 @{l.ig_cas}</a>}
                  {l.ultimo_video && <span>último vídeo {ddmm(l.ultimo_video)}</span>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
