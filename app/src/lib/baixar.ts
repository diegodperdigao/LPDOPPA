import type { Midia } from "./api";

function salvar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const limpa = (s: string) => s.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

// Baixa pelo fetch pra funcionar com arquivos de outro domínio (Storage), onde o atributo download é ignorado.
export async function baixarMidia(m: Midia) {
  const r = await fetch(m.url);
  if (!r.ok) throw new Error("Não deu pra baixar o arquivo.");
  salvar(await r.blob(), m.nome);
}

// Várias mídias num .zip, uma pasta por roteiro ("01 - Título").
export async function baixarZip(grupos: { pasta: string; midias: Midia[] }[], nomeZip: string, onProgresso?: (feitos: number, total: number) => void) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const total = grupos.reduce((n, g) => n + g.midias.length, 0);
  let feitos = 0;
  for (const g of grupos) {
    const dir = grupos.length > 1 ? zip.folder(limpa(g.pasta))! : zip;
    for (const m of g.midias) {
      const r = await fetch(m.url);
      if (!r.ok) throw new Error(`Não deu pra baixar ${m.nome}.`);
      dir.file(limpa(m.nome) || "arquivo", await r.blob());
      onProgresso?.(++feitos, total);
    }
  }
  salvar(await zip.generateAsync({ type: "blob" }), nomeZip);
}
