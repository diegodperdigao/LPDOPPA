import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { ContaProvider } from "./lib/conta";
import App from "./App";
import "./styles.css";
import { aplicarTema, lerTema } from "./lib/tema";

aplicarTema(lerTema());

// Na versão demo (página estática fora do nosso domínio) as rotas vão no #.
const Router = import.meta.env.VITE_DEMO === "1" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <ContaProvider>
        <App />
      </ContaProvider>
    </Router>
  </StrictMode>,
);
