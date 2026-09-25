// Normaliza o que a pessoa digitou (@, link, link com /reels, ?igsh=...) para o @ puro.
// Mesma regra do bot do Discord (normalizaHandle) e da função SQL app_norm_ig.
export function normalizaIg(raw: string): string {
  let s = (raw ?? "").trim().toLowerCase();
  if (!s) return "";
  const m = s.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(.+)$/);
  if (m) s = m[1];
  s = s.split("?")[0].split("#")[0].replace(/^@/, "");
  s = s.split("/")[0];
  return s.replace(/[^a-z0-9._]/g, "");
}

// Regras do Instagram: 1 a 30 caracteres, letras, números, ponto e underline.
export function igValido(handle: string): boolean {
  return /^[a-z0-9._]{1,30}$/.test(handle) && !handle.startsWith(".") && !handle.endsWith(".");
}

export const igUrl = (handle: string) => `https://www.instagram.com/${handle}`;
