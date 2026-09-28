import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ContaProvider } from "./lib/conta";
import App from "./App";
import "./styles.css";
import { aplicarTema, lerTema } from "./lib/tema";

aplicarTema(lerTema());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ContaProvider>
        <App />
      </ContaProvider>
    </BrowserRouter>
  </StrictMode>,
);
