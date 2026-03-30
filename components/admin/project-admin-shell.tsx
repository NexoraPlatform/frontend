"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  FileSignature,
  History,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PhoneCall,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { NotificationBell } from "@/components/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Link, usePathname, useRouter } from "@/lib/navigation";

type ProjectAdminShellProps = {
  children: React.ReactNode;
};

type AdminShellMenuItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
};

export function ProjectAdminShell({ children }: ProjectAdminShellProps) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const t = useTranslations();

  const userInitials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "AD";
  const userDisplayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "Trustora Admin";
  const userAvatarSrc = user?.avatar ?? undefined;

  const menuItems: AdminShellMenuItem[] = [
    { href: "/admin", icon: LayoutDashboard, label: t("admin.dashboard.shell.menu.dashboard"), exact: true },
    { href: "/admin/users", icon: Users, label: t("admin.dashboard.shell.menu.users") },
    { href: "/admin/services", icon: FileText, label: t("admin.dashboard.shell.menu.services") },
    { href: "/admin/orders", icon: FolderKanban, label: t("admin.dashboard.shell.menu.projects") },
    { href: "/admin/contracts", icon: FileSignature, label: t("admin.dashboard.shell.menu.contracts") },
    { href: "/admin/calls", icon: PhoneCall, label: t("admin.dashboard.shell.menu.calls") },
    { href: "/admin/disputes", icon: ShieldAlert, label: t("admin.dashboard.shell.menu.disputes") },
    { href: "/admin/legal/service-categories", icon: ScrollText, label: t("admin.dashboard.shell.menu.legal_service_categories") },
    { href: "/admin/legal/clauses", icon: ScrollText, label: t("admin.dashboard.shell.menu.legal_clauses") },
    { href: "/admin/newsletter", icon: Mail, label: t("admin.dashboard.shell.menu.newsletter") },
    { href: "/admin/activity", icon: Activity, label: t("admin.dashboard.shell.menu.activity") },
    { href: "/admin/audit-logs", icon: History, label: t("admin.dashboard.shell.menu.audit_logs") },
    { href: "/admin/roles", icon: ShieldCheck, label: t("admin.dashboard.shell.menu.roles") },
    { href: "/admin/analytics", icon: BarChart3, label: t("admin.dashboard.shell.menu.analytics") },
    { href: "/admin/settings", icon: Settings, label: t("admin.dashboard.shell.menu.settings") },
  ];

  const isActive = (item: AdminShellMenuItem) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const sidebarContent = (
    <>
      <div className="border-b border-border p-8">
        <Link
          href="/admin"
          className="flex items-center space-x-3 group"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="flex h-10 items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/trustora-logo2-60.webp"
              alt="Trustora Logo"
              width={60}
              height={75}
              className="h-10 w-auto"
              style={{ width: "auto", height: "2.5rem" }}
              priority
              quality={90}
            />
          </div>
          <div>
            <div className="text-lg font-bold">Trustora</div>
            <div className="text-xs text-muted-foreground">{t("admin.dashboard.shell.brand_label")}</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-6 py-8 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {active ? <span className="ml-auto h-2 w-2 rounded-full bg-primary" /> : null}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border space-y-4">
        <Link
          href="/admin/settings"
          onClick={() => setIsMobileOpen(false)}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            isActive({ href: "/admin/settings", icon: Settings, label: "" })
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">{t("admin.dashboard.shell.menu.settings")}</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            void logout();
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 text-left"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{t("admin.dashboard.shell.sign_out")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed left-4 top-4 z-40 rounded-lg p-2 transition-colors hover:bg-secondary md:hidden"
        onClick={() => setIsMobileOpen((value) => !value)}
        aria-label={t("admin.dashboard.shell.toggle_menu")}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </motion.button>

      {isMobileOpen ? (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed left-0 top-0 h-screen w-72 bg-card border-r border-border glass-effect z-30 flex flex-col overflow-y-auto md:hidden"
        >
          {sidebarContent}
        </motion.aside>
      ) : null}

      <aside className="hidden md:flex h-screen w-72 bg-card border-r border-border glass-effect flex-col overflow-y-auto">
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
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <Search className="w-5 h-5 text-muted-foreground ml-3 pointer-events-none" />
              <input
                type="text"
                placeholder={t("admin.dashboard.shell.search_placeholder")}
                className="flex-1 ml-2 py-2 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              <button
                type="button"
                onClick={toggleTheme}
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </button>

              <NotificationBell
                triggerClassName="relative p-2 rounded-lg hover:bg-secondary transition-colors group"
                iconClassName="!text-muted-foreground group-hover:!text-foreground transition-colors"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-0 rounded-lg hover:bg-secondary transition-colors group">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-white font-bold text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-effect rounded-2xl border border-border shadow-xl overflow-hidden">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="truncate text-sm font-medium">{userDisplayName}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/admin/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("admin.dashboard.shell.account_settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void logout();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("admin.dashboard.shell.sign_out")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
