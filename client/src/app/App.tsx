import { BrowserRouter, useLocation } from "react-router-dom";
import AppRouter from "./router/AppRouter";
import AppTopBar from "./layout/AppTopBar";
import AppFooter from "./layout/AppFooter";

function AppLayout() {
  const { pathname } = useLocation();
  const isAuthRoute = pathname === "/auth";

  return (
    <div className={`app-shell ${isAuthRoute ? "app-shell-auth" : "app-shell-app"}`}>
      <div
        className={`app-art-layer ${isAuthRoute ? "app-art-layer-auth" : "app-art-layer-app"}`}
        aria-hidden="true"
      >
        <img src="/logo.png" alt="" className="app-brand-watermark" />
      </div>
      <div
        className={`app-safe-zone ${isAuthRoute ? "app-safe-zone-auth" : "app-safe-zone-app"}`}
        aria-hidden="true"
      />
      {!isAuthRoute && <AppTopBar />}
      <main className={`app-content ${isAuthRoute ? "app-content-auth" : "app-content-app"}`}>
        <AppRouter />
      </main>
      {!isAuthRoute && <AppFooter />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
