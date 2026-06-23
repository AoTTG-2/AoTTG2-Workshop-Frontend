"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aottg2/ui";
import { Gauge, LogIn, LogOut, Moon, Sun, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./auth/useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="route-shell grid min-h-screen place-items-center bg-background p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Checking your session.</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

interface AppShellProps {
  children: ReactNode;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function AppShell({ children, theme, onToggleTheme }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar theme={theme} onToggleTheme={onToggleTheme} />
      <ScrollToTop />
      <div className="route-shell min-h-screen bg-background pt-14 lg:pt-16">{children}</div>
    </div>
  );
}

function TopBar({ theme, onToggleTheme }: Pick<AppShellProps, "theme" | "onToggleTheme">) {
  const { isAuthenticated, profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const accountLabel = isAuthenticated ? profile?.displayName ?? "ACCOUNT" : "LOGIN";
  const libraryActive = pathname === "/library" || pathname === "/";
  const accountActive = pathname === "/dashboard" || pathname === "/login";

  function closeFocusedMenu() {
    const activeElement = document.activeElement as { blur?: () => void } | null;
    activeElement?.blur?.();
  }

  function go(path: string) {
    router.push(path);
    setMobileOpen(false);
  }

  function goDashboardOrLogin() {
    closeFocusedMenu();
    go(isAuthenticated ? "/dashboard" : "/login");
  }

  async function handleLogout() {
    closeFocusedMenu();
    await logout();
    go("/library");
  }

  function switchTheme() {
    onToggleTheme();
    closeFocusedMenu();
    setMobileOpen(false);
  }

  return (
    <header className="fixed top-0 z-[1000] w-full overflow-visible">
      <div className="aottg2-texture relative z-[1000] flex h-14 w-full items-center justify-between px-4 shadow-lg lg:h-16 lg:px-8">
        <button type="button" className="workshop-control-free flex min-h-10 min-w-10 shrink-0 items-center transition-transform duration-150 ease-out active:scale-[0.96]" aria-label="AoTTG2 Workshop home" onClick={() => go("/")}>
          <span className="aottg2-text-logo font-primary text-lg leading-none tracking-wide sm:text-xl lg:text-2xl">
            <span className="aottg2-text-logo-part text-foreground" data-text="AoTTG">AoTTG</span>
            <span className="aottg2-text-logo-part aottg2-textured-text text-primary" data-text="WORKSHOP">WORKSHOP</span>
          </span>
        </button>

        <nav className="hidden flex-row items-center gap-6 font-primary text-foreground md:flex" aria-label="Primary navigation">
          <button type="button" className={`workshop-control-free transition-colors duration-150 ease-out hover:text-primary ${libraryActive ? "text-primary" : ""}`} onClick={() => go("/library")}>
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
          <MobileNavButton active={libraryActive} onClick={() => go("/library")}>Library</MobileNavButton>
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
  const nextThemeLabel = nextTheme === "dark" ? "Switch to Dark Mode" : "Switch to Light Mode";

  return (
    <div className="group relative z-[1101] flex h-full items-center">
      <button
        type="button"
        aria-haspopup="menu"
        className={`workshop-control-free inline-flex max-w-[12rem] cursor-pointer items-center gap-2 transition-colors duration-150 ease-out hover:text-primary focus:text-primary focus:outline-none ${accountActive ? "text-primary" : ""}`}
      >
        <span className="h-4 w-4 shrink-0" aria-hidden="true"><UserCircle className="h-4 w-4" /></span>
        <span className="truncate">{accountLabel}</span>
      </button>
      <div className="invisible fixed right-4 top-11 z-[1100] w-56 pt-1 opacity-0 transition-[opacity,visibility] duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 lg:right-8">
        <div role="menu" className={`aottg2-theme aottg2-palette-workshop aottg2-menu-content overflow-hidden rounded-none bg-popover p-1 text-popover-foreground shadow-md ${theme}`}>
          <MenuLabel>Account</MenuLabel>
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
          <MenuSeparator />
          <MenuLabel>Appearance</MenuLabel>
          <MenuItem onClick={onToggleTheme}>
            <MenuIcon>{nextTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</MenuIcon>
            {nextThemeLabel}
          </MenuItem>
        </div>
      </div>
    </div>
  );
}

function MenuIcon({ children }: { children: ReactNode }) {
  return <span className="mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">{children}</span>;
}

function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="aottg2-emboss-bg aottg2-cta-primary -mx-1 -mt-1 mb-1 px-3 py-2 font-primary text-xs uppercase leading-none tracking-wider text-primary-foreground">{children}</div>;
}

function MenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-muted" role="separator" />;
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void | Promise<void> }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="workshop-control-free relative flex w-full cursor-default select-none items-center rounded-none px-2 py-1.5 font-primary text-sm outline-none transition-[background-color,color,opacity] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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

function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
