import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aottg2/ui";
import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Gauge, LogIn, LogOut, Moon, Palette, Sun, UserCircle } from "lucide-react";
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

function TopBar({ theme, onToggleTheme }: AppProps) {
  const { isAuthenticated, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const accountLabel = isAuthenticated ? profile?.displayName ?? "ACCOUNT" : "LOGIN";
  const libraryActive = location.pathname === "/library" || location.pathname === "/";
  const accountActive = location.pathname === "/dashboard" || location.pathname === "/login";

  function closeFocusedMenu() {
    const activeElement = document.activeElement as { blur?: () => void } | null;
    activeElement?.blur?.();
  }

  function goLibrary() {
    navigate("/library");
    setMobileOpen(false);
  }

  function goDashboardOrLogin() {
    closeFocusedMenu();
    navigate(isAuthenticated ? "/dashboard" : "/login");
    setMobileOpen(false);
  }

  async function handleLogout() {
    closeFocusedMenu();
    await logout();
    navigate("/library");
    setMobileOpen(false);
  }

  function switchTheme() {
    onToggleTheme();
    closeFocusedMenu();
    setMobileOpen(false);
  }

  return (
    <header className="fixed top-0 z-[1000] w-full overflow-visible">
      <div className="aottg2-texture relative z-[1000] flex h-14 w-full items-center justify-between px-4 shadow-lg lg:h-16 lg:px-8">
        <button type="button" className="workshop-control-free flex min-h-10 min-w-10 shrink-0 items-center transition-transform duration-150 ease-out active:scale-[0.96]" aria-label="AoTTG2 Workshop home" onClick={() => navigate("/")}>
          <span className="aottg2-text-logo font-primary text-lg leading-none tracking-wide sm:text-xl lg:text-2xl">
            <span className="aottg2-text-logo-part text-foreground" data-text="AoTTG">AoTTG</span>
            <span className="aottg2-text-logo-part aottg2-textured-text text-primary" data-text="WORKSHOP">WORKSHOP</span>
          </span>
        </button>

        <nav className="hidden flex-row items-center gap-6 font-primary text-foreground md:flex" aria-label="Primary navigation">
          <button type="button" className={`workshop-control-free transition-colors duration-150 ease-out hover:text-primary ${libraryActive ? "text-primary" : ""}`} onClick={goLibrary}>
            LIBRARY
          </button>
          <AccountMenu
            accountActive={accountActive}
            accountLabel={accountLabel}
            isAuthenticated={isAuthenticated}
            theme={theme}
            nextTheme={nextTheme}
            onDashboardOrLogin={goDashboardOrLogin}
            onLogout={handleLogout}
            onToggleTheme={switchTheme}
          />
        </nav>

        <Button className="md:hidden" type="button" variant="ghost" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          MENU
        </Button>
      </div>

      {mobileOpen ? (
        <nav id="mobile-navigation" className="grid bg-background font-primary text-foreground shadow-[0_18px_30px_rgb(0_0_0_/_0.24)] md:hidden" aria-label="Mobile navigation">
          <MobileNavButton active={libraryActive} onClick={goLibrary}>Library</MobileNavButton>
          <MobileNavButton active={accountActive} onClick={goDashboardOrLogin}>{isAuthenticated ? "Dashboard" : "Login"}</MobileNavButton>
          <MobileNavButton onClick={switchTheme}>Switch to {nextTheme === "dark" ? "Dark" : "Light"} Mode</MobileNavButton>
          {isAuthenticated ? <MobileNavButton onClick={handleLogout}>Logout</MobileNavButton> : null}
        </nav>
      ) : null}
    </header>
  );
}

interface AccountMenuProps {
  accountActive: boolean;
  accountLabel: string;
  isAuthenticated: boolean;
  theme: "light" | "dark";
  nextTheme: "light" | "dark";
  onDashboardOrLogin: () => void;
  onLogout: () => void | Promise<void>;
  onToggleTheme: () => void;
}

function AccountMenu({ accountActive, accountLabel, isAuthenticated, theme, nextTheme, onDashboardOrLogin, onLogout, onToggleTheme }: AccountMenuProps) {
  return (
    <div className="group relative z-[1001] flex h-full items-center">
      <button
        type="button"
        aria-haspopup="menu"
        className={`workshop-control-free inline-flex max-w-[12rem] cursor-pointer items-center gap-2 transition-colors duration-150 ease-out hover:text-primary focus:text-primary focus:outline-none ${accountActive ? "text-primary" : ""}`}
      >
        <span className="h-4 w-4 shrink-0" aria-hidden="true"><UserCircle className="h-4 w-4" /></span>
        <span className="truncate">{accountLabel}</span>
      </button>
      <div className="invisible fixed right-4 top-11 z-[1002] w-56 opacity-0 transition-[opacity,transform,visibility] duration-150 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 lg:right-8">
        <div role="menu" className={`aottg2-theme aottg2-palette-workshop aottg2-menu-content overflow-hidden rounded-none border border-border bg-popover p-1 text-popover-foreground shadow-md ${theme}`}>
          <MenuItem onClick={onDashboardOrLogin}>
            <MenuIcon>{isAuthenticated ? <Gauge className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}</MenuIcon>
            {isAuthenticated ? "Dashboard" : "Login"}
          </MenuItem>
          {isAuthenticated ? (
            <MenuItem onClick={onLogout}>
              <MenuIcon><LogOut className="h-4 w-4" /></MenuIcon>
              Logout
            </MenuItem>
          ) : null}
          <div className="-mx-1 my-1 h-px bg-muted" role="separator" />
          <div className="aottg2-texture aottg2-texture-primary -mx-1 -mt-1 mb-1 px-3 py-2 font-primary text-xs uppercase leading-none tracking-wide text-primary-foreground">
            Appearance
          </div>
          <MenuItem onClick={onToggleTheme}>
            <MenuIcon><Palette className="h-4 w-4" /></MenuIcon>
            <span className="mr-auto">Theme</span>
            {nextTheme === "dark" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
          </MenuItem>
        </div>
      </div>
    </div>
  );
}

function MenuIcon({ children }: { children: ReactNode }) {
  return <span className="mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">{children}</span>;
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void | Promise<void> }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="workshop-control-free relative flex w-full cursor-pointer select-none items-center rounded-none px-2 py-1.5 text-left text-sm outline-none transition-[background-color,color,opacity] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
    >
      {children}
    </button>
  );
}

function MobileNavButton({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void | Promise<void> }) {
  return (
    <button type="button" className={`workshop-control-free w-full p-4 text-left transition-colors duration-150 ease-out hover:bg-muted ${active ? "text-primary" : ""}`} onClick={onClick}>
      {children}
    </button>
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

function LegacyAssetRedirect() {
  const { id = "" } = useParams();
  return <Navigate to={`/library/${id}`} replace />;
}

export default function App({ theme, onToggleTheme }: AppProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar theme={theme} onToggleTheme={onToggleTheme} />
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
        <div className="route-shell min-h-screen bg-background pt-14 lg:pt-16">
          <Routes>
            <Route index element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<Marketplace />} />
            <Route path="/library/:id" element={<AssetDetail />} />
            <Route
              path="/library/publish"
              element={
                <RequireAuth>
                  <CreateAsset />
                </RequireAuth>
              }
            />
            <Route path="/assets" element={<Navigate to="/library" replace />} />
            <Route path="/assets/:id" element={<LegacyAssetRedirect />} />
            <Route path="/assets/publish" element={<Navigate to="/library/publish" replace />} />
            <Route path="/marketplace" element={<Navigate to="/library" replace />} />
            <Route path="/marketplace/assets/:id" element={<LegacyAssetRedirect />} />
            <Route path="/marketplace/create" element={<Navigate to="/library/publish" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Routes>
        </div>
      </Suspense>
    </div>
  );
}
