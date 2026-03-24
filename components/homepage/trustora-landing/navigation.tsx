"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { TrustoraLandingBrand } from "@/components/homepage/trustora-landing/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOptionalAuth } from "@/contexts/auth-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePublicAuth } from "@/hooks/use-public-auth";
import { getRoleSlugs, isSuperUser } from "@/lib/access";
import { Link, usePathname } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { revealEase } from "./constants";

const NotificationBell = dynamic(
  () => import("@/components/notification-bell").then((mod) => mod.NotificationBell),
  {
    ssr: false,
    loading: () => (
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 rounded-xl border border-white/10 bg-white/70 text-foreground shadow-sm dark:bg-[#0B1220]"
      >
        <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
      </Button>
    ),
  }
);

const ChatButton = dynamic(
  () => import("@/components/chat/chat-button").then((mod) => mod.ChatButton),
  {
    ssr: false,
    loading: () => (
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 rounded-xl border border-white/10 bg-white/70 text-foreground shadow-sm dark:bg-[#0B1220]"
      >
        <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
      </Button>
    ),
  }
);

const themeButtonClass =
  "h-11 w-11 rounded-xl border border-white/10 bg-white/70 text-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:bg-white hover:text-foreground dark:bg-[#0B1220] dark:text-white dark:hover:bg-[#101A2D] dark:hover:text-white";

const utilitySurfaceClass =
  "border border-white/10 bg-white/70 text-foreground shadow-sm backdrop-blur-xl hover:bg-white hover:text-foreground dark:bg-[#0B1220] dark:text-white dark:hover:bg-[#101A2D] dark:hover:text-white";

export function TrustoraLandingNavigation() {
  const pathname = usePathname();
  const authContext = useOptionalAuth();
  const publicAuth = usePublicAuth(!authContext);
  const user = authContext?.user ?? publicAuth.user;
  const loading = authContext?.loading ?? publicAuth.loading;
  const logout = authContext?.logout ?? publicAuth.logout;
  const canUseRealtimeControls = Boolean(authContext?.user);
  const { isDarkMode, isThemeMounted, toggleTheme } = useAppTheme();
  const t = useTranslations();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navLinks = useMemo(
    () => [
      { name: t("navigation.home"), href: "/" },
      { name: t("navigation.services"), href: "/services" },
      { name: t("navigation.projects"), href: "/projects" },
      { name: t("navigation.about"), href: "/about" },
      { name: t("navigation.help"), href: "/help" },
      { name: t("navigation.contact"), href: "/contact" },
    ],
    [t]
  );

  const themeToggleLabel = isThemeMounted
    ? `${t("common.change_theme")} ${isDarkMode ? t("common.light") : t("common.dark")}`
    : t("common.change_theme");

  const roleSlugs = getRoleSlugs((user as any) ?? null);
  const isAdminUser = isSuperUser((user as any) ?? null) || roleSlugs.includes("admin");
  const isProviderUser = roleSlugs.includes("provider");

  const userFirstName = user?.firstName ?? (user as any)?.first_name ?? "";
  const userLastName = user?.lastName ?? (user as any)?.last_name ?? "";
  const userDisplayName = `${userFirstName} ${userLastName}`.trim() || user?.email || "User";
  const userInitials =
    `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    void logout();
  };

  const authActionsPlaceholder = (
    <div className="flex items-center gap-2 pl-2" aria-hidden="true">
      <div className="h-11 w-24 animate-pulse rounded-xl bg-white/60 dark:bg-white/10" />
      <div className="h-11 w-28 animate-pulse rounded-xl bg-white/80 dark:bg-white/15" />
    </div>
  );

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: revealEase }}
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "glass-effect border-b border-white/10 shadow-lg backdrop-blur-xl"
          : "bg-transparent"
      )}
      aria-label={t("navigation.main_navigation")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center"
          >
            <Link href="/" aria-label={`Trustora - ${t("navigation.home")}`} className="flex items-center">
              <TrustoraLandingBrand priority textClassName="text-xl font-bold tracking-tight" />
            </Link>
          </motion.div>

          <div className="hidden items-center space-x-7 lg:flex">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + index * 0.06, duration: 0.6 }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium transition-colors duration-200 hover:text-foreground",
                    isActiveLink(link.href) ? "text-foreground" : "text-foreground/75"
                  )}
                >
                  {link.name}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-0.5 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-200",
                      isActiveLink(link.href) ? "w-full" : "w-0"
                    )}
                  />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {canUseRealtimeControls && user ? (
              <>
                <NotificationBell
                  triggerClassName={cn("h-11 w-11 rounded-xl", utilitySurfaceClass)}
                  iconClassName="text-foreground"
                  badgeClassName="border-background dark:border-[#0B1220]"
                />
                <ChatButton
                  triggerClassName={cn("h-11 w-11 rounded-xl", utilitySurfaceClass)}
                  badgeClassName="border-background dark:border-[#0B1220]"
                />
              </>
            ) : null}

            <LocaleSwitcher className={cn("rounded-xl", utilitySurfaceClass)} />
            <CurrencySwitcher className={cn("rounded-xl", utilitySurfaceClass)} />

            {isThemeMounted ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={themeButtonClass}
                aria-label={themeToggleLabel}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            ) : null}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("h-11 w-11 rounded-xl p-0", utilitySurfaceClass)}
                    aria-label={t("navigation.open_main_user_menu")}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={(user as any)?.avatar ?? undefined} alt={userDisplayName} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">{t("navigation.dashboard")}</Link>
                  </DropdownMenuItem>
                  {isProviderUser ? (
                    <DropdownMenuItem asChild>
                      <Link href="/provider/profile">{t("navigation.edit_profile")}</Link>
                    </DropdownMenuItem>
                  ) : null}
                  {isAdminUser ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">{t("navigation.admin_panel")}</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("navigation.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : loading ? (
              authActionsPlaceholder
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  href="/auth/signin"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground"
                >
                  {t("navigation.login")}
                </Link>
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-xl bg-primary px-5 font-medium text-white transition-all duration-200 hover:bg-primary/90"
                >
                  <Link href="/auth/signup">{t("navigation.register")}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {canUseRealtimeControls && user ? (
              <>
                <NotificationBell
                  triggerClassName={cn("h-10 w-10 rounded-xl", utilitySurfaceClass)}
                  iconClassName="text-foreground"
                  badgeClassName="border-background dark:border-[#0B1220]"
                />
                <ChatButton
                  triggerClassName={cn("h-10 w-10 rounded-xl", utilitySurfaceClass)}
                  badgeClassName="border-background dark:border-[#0B1220]"
                />
              </>
            ) : null}

            {isThemeMounted ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn("h-10 w-10 rounded-xl", utilitySurfaceClass)}
                aria-label={themeToggleLabel}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className={cn("h-10 w-10 rounded-xl", utilitySurfaceClass)}
              aria-label={t("trustora.landing.navigation.mobile_toggle")}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-effect border-t border-white/10 lg:hidden"
        >
          <div className="space-y-6 px-4 py-6 sm:px-6">
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-base font-medium transition-colors duration-200",
                    isActiveLink(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-white/60 hover:text-foreground dark:hover:bg-[#101A2D]"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <LocaleSwitcher className={cn("rounded-xl", utilitySurfaceClass)} />
              <CurrencySwitcher className={cn("rounded-xl", utilitySurfaceClass)} />
            </div>

            {user ? (
              <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/60 p-4 dark:bg-[#0B1220]/80">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={(user as any)?.avatar ?? undefined} alt={userDisplayName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold">{userDisplayName}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-white dark:hover:bg-[#101A2D]"
                  >
                    {t("navigation.dashboard")}
                  </Link>
                  {isProviderUser ? (
                    <Link
                      href="/provider/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-white dark:hover:bg-[#101A2D]"
                    >
                      {t("navigation.edit_profile")}
                    </Link>
                  ) : null}
                  {isAdminUser ? (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-white dark:hover:bg-[#101A2D]"
                    >
                      {t("navigation.admin_panel")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/85 transition-colors hover:bg-white dark:hover:bg-[#101A2D]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("navigation.logout")}
                  </button>
                </div>
              </div>
            ) : loading ? null : (
              <div className="grid gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-xl border-white/15 bg-white/70 font-medium text-foreground hover:bg-white hover:text-foreground dark:bg-[#0B1220] dark:text-white dark:hover:bg-[#101A2D] dark:hover:text-white"
                >
                  <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("navigation.login")}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-12 rounded-xl bg-primary font-medium text-white hover:bg-primary/90"
                >
                  <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("navigation.register")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </motion.nav>
  );
}
