import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./app/App";
import "./index.css";

import { AuthProvider } from "./features/auth/state/auth-context"; // global auth state provider
import { appTheme } from "./app/theme/theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>

    {/* wraps entire app so auth is available everywhere */}
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>

  </React.StrictMode>
);
