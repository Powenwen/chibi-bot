import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@skyra/discord-components-core";
import "./index.css";
import App from "./App";
import { setUnauthorizedHandler } from "./services/api";
import { useStore } from "./store/useStore";

// Register the global 401 handler — clears Zustand auth state and redirects
setUnauthorizedHandler(() => {
  useStore.getState().handleUnauthorized();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
