import { createPortal } from "react-dom";

// Modais saem da árvore da página: animações com transform no conteúdo
// criariam um novo contexto e prenderiam o position: fixed.
export default function Portal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
