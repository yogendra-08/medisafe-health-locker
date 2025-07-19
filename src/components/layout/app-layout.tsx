"use client";

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { auth } from "@/lib/firebase/config";
import { useRouter, usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Upload,
  User as UserIcon,
  Bot
} from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/upload", icon: Upload, label: "Upload" },
  // { href: "/assistant", icon: Bot, label: "AI Assistant" },
  { href: "/profile", icon: UserIcon, label: "Health Profile" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton
                      as="a"
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <Separator className="my-2" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="truncate group-data-[collapsible=icon]:hidden">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1 flex items-center gap-4">
                    <h1 className="text-lg font-semibold">
                        {navItems.find(item => item.href === pathname)?.label || 'MediSafe'}
                    </h1>
                    <span className="ml-4 text-base text-muted-foreground hidden md:inline">
                        {user?.email ? `Welcome, ${user.email.split('@')[0]}!` : 'Welcome!'}
                    </span>
                </div>
                {/* Dark mode toggle will be in the layout.tsx for global access */}
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
