import { Link, useRouterState } from "@tanstack/react-router";
import {
  IconChevronDown,
  IconLogout,
  IconHexagon3d,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { useGetUser, useSignOut } from "@/hooks/useAuth";
import { routes } from ".";

import { useQuery } from "@tanstack/react-query";
import { getAuthState } from "@/server/auth";

export function AppSidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { mutate: signOut } = useSignOut();
  const { data: user } = useGetUser();

  const data = useQuery({
    queryKey: ["auth-state"],
    queryFn: () => getAuthState(),
  });

  const isAuthEnabled = data.data?.authEnabled ?? true;

  const handleLogout = () => {
    signOut();
    navigate({ to: "/sign-in" });
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={APP_NAME}>
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <IconHexagon3d className="size-4" />
                </div>
                {open && (
                  <div className="flex flex-col leading-none">
                    <span className="font-semibold tracking-tight text-sm">
                      {APP_NAME}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {APP_DESCRIPTION}
                    </span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map(({ title, url, icon: Icon }) => (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    isActive={currentPath === url}
                    tooltip={title}
                    render={<Link to={url} />}
                  >
                    <Icon className="size-4" />
                    <span>{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {isAuthEnabled && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      tooltip="Account"
                      className="cursor-pointer"
                    />
                  }
                >
                  <Avatar className="size-7 rounded-full">
                    <AvatarFallback className="rounded-full bg-sidebar text-[11px] font-medium">
                      {user?.data?.attributes?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col leading-none">
                    <span className="text-sm font-medium">
                      {user?.data?.attributes?.name ?? "User Name"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {user?.data?.attributes?.email ?? "Email"}
                    </span>
                  </div>
                  <IconChevronDown className="ml-auto size-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    <IconLogout className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
