import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aottg2/ui";
import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./auth/useAuth";

const Login = lazy(() => import("./page/Login"));
const Marketplace = lazy(() => import("./page/Marketplace").then((m) => ({ default: m.Marketplace })));
const AssetDetail = lazy(() => import("./page/AssetDetail").then((m) => ({ default: m.AssetDetail })));
const CreateAsset = lazy(() => import("./page/CreateAsset").then((m) => ({ default: m.CreateAsset })));
const Dashboard = lazy(() => import("./page/Dashboard").then((m) => ({ default: m.DashboardShell })));

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="route-shell grid min-h-screen place-items-center p-6 bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Checking your session.</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

interface AppProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

interface NavItem {
  label: string;
  active?: boolean;
  onClick: () => void;
}

function TopBar({ theme, onToggleTheme }: AppProps) {
  const { isAuthenticated, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items: NavItem[] = [
    { label: "MARKETPLACE", active: location.pathname === "/marketplace" || location.pathname === "/", onClick: () => navigate("/marketplace") },
    ...(isAuthenticated
      ? [
          { label: `CREATOR (${profile?.displayName ?? "ACCOUNT"})`, active: location.pathname === "/dashboard", onClick: () => navigate("/dashboard") },
          { label: "LOGOUT", onClick: () => void logout().then(() => navigate("/marketplace")) },
        ]
      : [{ label: "LOGIN", active: location.pathname === "/login", onClick: () => navigate("/login") }]),
  ];

  function selectItem(item: NavItem) {
    item.onClick();
    setMobileOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-background/95 shadow-[0_14px_40px_rgb(0_0_0_/_0.28)] backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button type="button" className="workshop-logo-button workshop-control-free flex shrink-0 items-center font-primary text-4xl leading-none tracking-wide sm:text-5xl" aria-label="AoTTG2 Workshop home" onClick={() => navigate("/")}>
          <span className="text-foreground">AoTTG</span>
          <span className="text-primary">WORKSHOP</span>
        </button>

        <nav className="hidden min-w-0 items-center justify-end gap-7 md:flex" aria-label="Primary navigation">
          {items.map((item) => (
            <button key={item.label} type="button" className={`workshop-control-free font-primary text-xl uppercase leading-none transition-colors hover:text-primary ${item.active ? "text-primary" : "text-foreground"}`} onClick={() => selectItem(item)}>
              {item.label}
            </button>
          ))}
          <button type="button" className="workshop-control-free font-primary text-xl uppercase leading-none text-foreground transition-colors hover:text-primary" onClick={onToggleTheme}>
            {theme === "dark" ? "LIGHT" : "DARK"}
          </button>
        </nav>

        <Button className="md:hidden" type="button" variant="ghost" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          MENU
        </Button>
      </div>

      {mobileOpen ? (
        <nav id="mobile-navigation" className="grid gap-2 bg-background px-4 pb-4 shadow-[0_18px_30px_rgb(0_0_0_/_0.24)] md:hidden" aria-label="Mobile navigation">
          {items.map((item) => (
            <Button key={item.label} className="w-full justify-start" type="button" variant={item.active ? "default" : "ghost"} onClick={() => selectItem(item)}>
              {item.label}
            </Button>
          ))}
          <Button className="w-full justify-start" type="button" variant="ghost" onClick={onToggleTheme}>
            {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
          </Button>
        </nav>
      ) : null}
    </header>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="route-shell flex min-h-screen items-center justify-center bg-background">
      <div className="grid gap-3 text-sm font-medium text-muted-foreground">
        <span
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-hidden="true"
        />
        <span>Loading page…</span>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App({ theme, onToggleTheme }: AppProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar theme={theme} onToggleTheme={onToggleTheme} />
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
        <div className="route-shell min-h-screen bg-background pt-20">
          <Routes>
            <Route index element={<Navigate to="/marketplace" replace />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/assets/:id" element={<AssetDetail />} />
            <Route
              path="/marketplace/create"
              element={
                <RequireAuth>
                  <CreateAsset />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/marketplace" replace />} />
          </Routes>
        </div>
      </Suspense>
    </div>
  );
}
