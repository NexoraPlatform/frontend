"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  History,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { TrustoraLogo } from "@/components/branding/trustora-logo";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatButton } from "@/components/chat/chat-button";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  getNewProjectHref,
  getProviderProfileHref,
} from "@/lib/dashboard-navigation";
import { Link, useRouter } from "@/lib/navigation";

type DashboardShellTab =
  | "overview"
  | "projects"
  | "services"
  | "messages"
  | "settings";

type DashboardShellMenu = DashboardShellTab | "edit-profile";

type TrustoraDashboardShellProps = {
  activeMenu: DashboardShellMenu;
  isProvider: boolean;
  isClient: boolean;
  onMenuSelect: (menu: DashboardShellTab) => void;
  children: ReactNode;
};

type DashboardThemeVars = {
  "--bg-main": string;
  "--bg-card": string;
  "--text-main": string;
  "--text-muted": string;
  "--border-color": string;
  "--header-bg": string;
  "--input-bg": string;
  "--stat-bg": string;
};

type MenuItem = {
  key: DashboardShellMenu;
  label: string;
  icon: LucideIcon;
  action: () => void;
};

const dashboardThemes: Record<"light" | "dark", DashboardThemeVars> = {
  light: {
    "--bg-main": "#F5F7FA",
    "--bg-card": "#FFFFFF",
    "--text-main": "#0B1C2D",
    "--text-muted": "#64748B",
    "--border-color": "rgba(226, 232, 240, 0.8)",
    "--header-bg": "rgba(255, 255, 255, 0.88)",
    "--input-bg": "#FFFFFF",
    "--stat-bg": "#F5F7FA",
  },
  dark: {
    "--bg-main": "#06111A",
    "--bg-card": "#0D1F30",
    "--text-main": "#F8FAFC",
    "--text-muted": "#94A3B8",
    "--border-color": "rgba(255, 255, 255, 0.08)",
    "--header-bg": "rgba(13, 31, 48, 0.86)",
    "--input-bg": "#08131E",
    "--stat-bg": "#152A40",
  },
};

function HeaderPrimaryAction({
  isProvider,
  onClick,
  label,
}: {
  isProvider: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = isProvider ? Layers : Plus;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-[#1BC47D] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#1BC47D]/20 transition-all hover:bg-[#18A96B]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function TrustoraDashboardShell({
  activeMenu,
  isProvider,
  isClient,
  onMenuSelect,
  children,
}: TrustoraDashboardShellProps) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const t = useTranslations();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentTheme = isDarkMode ? dashboardThemes.dark : dashboardThemes.light;
  const headerUtilityButtonClass = isDarkMode
    ? "!border-white/10 !bg-[#0B1220] !text-white hover:!bg-white/10 hover:!text-white"
    : "!border-slate-200/80 !bg-white !text-[#0B1C2D] hover:!bg-slate-100 hover:!text-[#0B1C2D]";
  const headerUtilityIconClass = isDarkMode ? "!text-white" : "!text-[#0B1C2D]";
  const headerSelectButtonClass = isDarkMode
    ? "!text-white hover:!text-white"
    : "!text-[#0B1C2D] hover:!text-[#0B1C2D]";
  const userInitials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "TR";
  const userDisplayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "Trustora";
  const userAvatarSrc = user?.avatar ?? user?.profile_photo_url ?? user?.avatar_url ?? undefined;

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        key: "overview",
        label: t("dashboard.tabs.overview"),
        icon: LayoutDashboard,
        action: () => onMenuSelect("overview"),
      },
      {
        key: "projects",
        label: t("dashboard.tabs.projects"),
        icon: Layers,
        action: () => onMenuSelect("projects"),
      },
      {
        key: "services",
        label: t("dashboard.tabs.services"),
        icon: Users,
        action: () => onMenuSelect("services"),
      },
      {
        key: "messages",
        label: t("dashboard.tabs.messages"),
        icon: History,
        action: () => onMenuSelect("messages"),
      },
    ];

    if (isProvider) {
      items.push({
        key: "edit-profile",
        label: t("navigation.edit_profile"),
        icon: FileText,
        action: () => router.push(getProviderProfileHref()),
      });
    }

    return items;
  }, [isProvider, onMenuSelect, router, t]);

  const primaryActionLabel = isProvider
    ? t("dashboard.tabs.projects")
    : t("dashboard.projects.new_project");

  const sidebarItemClass = (item: DashboardShellMenu) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
      activeMenu === item
        ? "border border-[#1BC47D]/20 bg-[#1BC47D]/10 text-[#1BC47D]"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  const sidebarContent = (
    <>
      <div>
        <div className="flex h-20 items-center border-b border-white/5 px-6">
          <Link
            href="/dashboard"
            className="group flex items-center"
            onClick={() => setIsMobileOpen(false)}
          >
            <TrustoraLogo
              alt="Trustora dashboard logo"
              className="transition-transform group-hover:scale-[1.02]"
              imageClassName="h-14 w-auto"
              priority
              sizes="190px"
              variant="dark"
            />
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          <p className="mb-3 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {t("dashboard.quick_actions.title")}
          </p>
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.button
                key={item.key}
                type="button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  item.action();
                  setIsMobileOpen(false);
                }}
                className={sidebarItemClass(item.key)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/5 p-4">
        <button
          type="button"
          onClick={() => {
            onMenuSelect("settings");
            setIsMobileOpen(false);
          }}
          className={`${sidebarItemClass("settings")} mb-2`}
        >
          <Settings className="h-5 w-5" />
          <span>{t("dashboard.tabs.settings")}</span>
        </button>

        <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/5 bg-[#152B42] px-3 py-2">
          <div className="relative">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
              <AvatarFallback className="bg-gradient-to-tr from-[#1BC47D] to-[#0B1C2D] text-xs font-bold text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#152B42] bg-[#1BC47D]" />
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-white">{userDisplayName}</p>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#1BC47D]">
              <CheckCircle2 className="h-2.5 w-2.5" />
              {isProvider ? t("dashboard.hero.role.provider") : t("dashboard.hero.role.client")}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans"
      style={
        {
          ...currentTheme,
          backgroundColor: "var(--bg-main)",
          color: "var(--text-main)",
        } as CSSProperties
      }
    >
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed left-4 top-4 z-40 rounded-lg p-2 transition-colors hover:bg-secondary md:hidden"
        onClick={() => setIsMobileOpen((value) => !value)}
        aria-label={t("dashboard.shell.toggle_menu")}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </motion.button>

      {isMobileOpen ? (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col justify-between overflow-y-auto border-r border-[#152B42] bg-[#0B1C2D] md:hidden"
        >
          {sidebarContent}
        </motion.aside>
      ) : null}

      <aside className="z-20 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-[#152B42] bg-[#0B1C2D] md:flex">
        {sidebarContent}
      </aside>

      {isMobileOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-effect sticky top-0 z-20 border-b border-border"
          style={{ backgroundColor: "var(--header-bg)" }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <div
                  className="rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--input-bg)" }}
                >
                  <LocaleSwitcher className={`h-9 rounded-lg px-2 ${headerSelectButtonClass}`} />
                </div>
                <div
                  className="rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--input-bg)" }}
                >
                  <CurrencySwitcher
                    className={`h-9 rounded-lg px-2 text-sm font-semibold ${headerSelectButtonClass}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="relative transition-colors hover:text-[var(--text-main)]"
                style={{ color: "var(--text-muted)" }}
                title="Toggle Light/Dark Mode"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <NotificationBell
                triggerClassName={headerUtilityButtonClass}
                iconClassName={headerUtilityIconClass}
              />
              <ChatButton triggerClassName={headerUtilityButtonClass} />

              <div className="hidden h-6 w-px md:block" style={{ backgroundColor: "var(--border-color)" }} />

              <HeaderPrimaryAction
                isProvider={isProvider}
                onClick={() => {
                  if (isProvider) {
                    onMenuSelect("projects");
                    return;
                  }

                  if (isClient) {
                    router.push(getNewProjectHref());
                  }
                }}
                label={primaryActionLabel}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative rounded-lg p-0 transition-colors hover:bg-secondary">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-sm font-bold text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 overflow-hidden rounded-2xl border border-border glass-effect shadow-xl"
                >
                  <DropdownMenuLabel className="space-y-1">
                    <p className="truncate text-sm font-medium">{userDisplayName}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      if (isProvider) {
                        router.push(getProviderProfileHref());
                        return;
                      }

                      onMenuSelect("settings");
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{isProvider ? t("navigation.edit_profile") : t("dashboard.tabs.settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onMenuSelect("settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("dashboard.tabs.settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void logout();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("dashboard.shell.sign_out")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.header>

        <main className="relative flex-1 overflow-auto">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
            style={{
              backgroundImage: "radial-gradient(var(--text-main) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
