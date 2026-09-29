// Utilidades pros arquivos que vêm da pasta do Drive (soltos ou no .zip que o Drive gera).
const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", heic: "image/heic",
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm",
};
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };

// Arquivo do Drive às vezes vem sem extensão ("4", "25"): descobre o tipo pelos primeiros bytes.
async function farejar(blob: Blob): Promise<string | null> {
  const b = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57) return "image/webp";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return b[8] === 0x71 && b[9] === 0x74 ? "video/quicktime" : "video/mp4";
  return null;
}

// Garante tipo e extensão certos (o Storage e o download dependem disso).
export async function normalizarArquivo(blob: Blob, nome: string): Promise<File | null> {
  const base = nome.split("/").pop()!;
  const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
  let tipo: string | null = MIME[ext] ?? (blob.type || null);
  if (!tipo || !(tipo.startsWith("image/") || tipo.startsWith("video/"))) tipo = await farejar(blob);
  if (!tipo) return null;
  const final = MIME[ext] ? base : `${base}.${EXT[tipo] ?? "bin"}`;
  return new File([blob], final, { type: tipo });
}

// Aceita arquivos soltos e .zip (a pasta baixada do Drive).
export async function abrirArquivos(lista: FileList | File[], onProgresso?: (msg: string) => void): Promise<File[]> {
  const saida: File[] = [];
  for (const f of Array.from(lista)) {
    if (/\.zip$/i.test(f.name) || f.type === "application/zip") {
      onProgresso?.(`Abrindo ${f.name}…`);
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(f);
      for (const e of Object.values(zip.files)) {
        if (e.dir || /(^|\/)(__MACOSX|\.)/.test(e.name)) continue;
        const arq = await normalizarArquivo(await e.async("blob"), e.name);
        if (arq) saida.push(arq);
      }
    } else {
      const arq = await normalizarArquivo(f, f.name);
      if (arq) saida.push(arq);
    }
  }
  return saida;
}

// Colando do Google Docs vem HTML: vira texto com "# " nos títulos e "- " nas listas.
export function htmlParaTexto(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const linhas: string[] = [];
  const blocos = doc.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li");
  if (!blocos.length) return doc.body.textContent ?? "";
  blocos.forEach((el) => {
    const t = (el.textContent ?? "").replace(/ /g, " ").trim();
    if (/^H[1-6]$/.test(el.tagName)) linhas.push("", `# ${t}`, "");
    else if (el.tagName === "LI") linhas.push(`- ${t}`);
    else linhas.push(t);
  });
  return linhas.join("\n");
}
