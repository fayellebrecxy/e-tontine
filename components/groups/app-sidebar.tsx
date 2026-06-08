"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  Settings,
  Repeat,
  Landmark,
  Wallet,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const items = [
  { label: "Aperçu", href: "", icon: LayoutDashboard },
  { label: "Membres", href: "members", icon: Users },
  { label: "Invitations", href: "invitations", icon: Mail },
  { label: "Rubriques", href: "rubriques", icon: Landmark },
  { label: "Cycles", href: "cycles", icon: Repeat },
  { label: "Finances", href: "finances", icon: Wallet },
  { label: "Paramètres", href: "settings", icon: Settings },
];

export function AppSidebar({
  groupId,
  groupName,
  isAdmin,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/dashboard/groups/${groupId}`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-600 text-sidebar-primary-foreground">
                  <Landmark className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{groupName}</span>
                  <span className="truncate text-xs">{isAdmin ? "Administrateur" : "Membre"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu du groupe</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const href = item.href
                ? `/dashboard/groups/${groupId}/${item.href}`
                : `/dashboard/groups/${groupId}`;
              const active = item.href
                ? pathname.startsWith(href)
                : pathname === `/dashboard/groups/${groupId}`;

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={active}
                  >
                    <Link href={href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
