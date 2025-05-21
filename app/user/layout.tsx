"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  X,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Building2,
  Clock,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { UserThemeSwitcher } from "@/components/theme-switcher";
import { signOutUser } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { format } from "date-fns";

export default function userLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return null;
  }

  const avatarUrl = ``;

  const getPageTitle = () => {
    if (pathname.startsWith("/user/dashboard")) return "Overview";
    if (pathname.startsWith("/user/payables")) return "Payables";
    if (pathname.startsWith("/user/month")) return "Track Payables";
    return "User";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-40 md:static transition-all bg-card border-r shadow-sm flex flex-col min-h-screen flex-shrink-0",
          collapsed ? "w-20" : "w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center border-b justify-between p-2 shadow-sm">
          <div className="flex items-center">
            <div className="shrink-0 flex items-center justify-center h-13 w-13">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-11 w-11 object-contain"
              />
            </div>
            {!collapsed && (
              <span className="text-md font-bold ml-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                  DebtLite
                </span>
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator />

        {/* Nav links */}
        <ScrollArea className="flex-1 px-2 py-4 space-y-2">
          <nav className="flex flex-col gap-2">
            <SidebarLink
              href="/user/dashboard"
              label="Overview"
              icon={LayoutDashboard}
              collapsed={collapsed}
            />
            <SidebarLink
              href="/user/month"
              label="Track Current Month"
              icon={LayoutDashboard}
              collapsed={collapsed}
            />
            <SidebarLink
              href="/user/payables"
              label="Payables"
              icon={Users}
              collapsed={collapsed}
            />
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
              {(user.profile?.display_name || "User")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0).toUpperCase())
                .join("")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <div className="text-sm font-medium">
                {user.profile?.display_name}
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main layout */}
      <div className="flex flex-col flex-1 h-full">
        {/* Topbar */}
        <header className="flex items-center justify-between pl-4 pr-2 py-3 bg-background border-b shadow-sm h-16">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronsRight className="h-5 w-5" />
              ) : (
                <ChevronsLeft className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-xl font-semibold hidden md:block text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme toggle */}
            <UserThemeSwitcher />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline">
                  <Bell className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-65 p-2">
                <DropdownMenuLabel className="text-md font-semibold text-foreground">
                  Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  No New Notifications available
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary hover:text-primary/80 font-medium">
                  View All Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                      {(user.profile?.display_name || "User")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((word) => word.charAt(0).toUpperCase())
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {/* 👇 Hide name on mobile, show on md+ */}
                  {!collapsed && (
                    <span className="hidden md:block text-sm font-medium">
                      {user.profile?.display_name}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <form action={signOutUser} className="w-full">
                  <DropdownMenuItem asChild>
                    <button
                      type="submit"
                      className="w-full text-left text-red-600 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto mb-7 md:mb-7">
          {children}
          <footer className="pt-5 text-center text-muted-foreground text-sm">
            <p>🎯 Best of luck! Keep pushing forward.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3",
          isActive && "font-semibold",
          collapsed ? "px-3 justify-center" : "px-4"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="w-5 h-5" />
        {!collapsed && label}
      </Button>
    </Link>
  );
}
