import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Navbar, type NavbarItem } from "@aottg2/ui";
import { lazy, Suspense, useEffect } from "react";
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

function TopBar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const items: NavbarItem[] = [
    { label: "MARKETPLACE", href: "/marketplace", active: location.pathname === "/marketplace" || location.pathname === "/" },
    ...(isAuthenticated
      ? [
          { label: `CREATOR (${profile?.displayName ?? "ACCOUNT"})`, id: "dashboard", active: location.pathname === "/dashboard" },
          { label: "LOGOUT", id: "logout" },
        ]
      : [{ label: "LOGIN", href: "/login", active: location.pathname === "/login" }]),
  ];

  function handleNav(item: NavbarItem) {
    if (item.href) {
      navigate(item.href);
      return;
    }

    if (item.id === "dashboard") {
      navigate("/dashboard");
      return;
    }

    if (item.id === "logout") {
      void logout().then(() => navigate("/marketplace"));
    }
  }

  return <Navbar items={items} logo="text" logoText="WORKSHOP" onLogoClick={() => navigate("/")} onItemSelect={handleNav} fixed />;
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

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
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
