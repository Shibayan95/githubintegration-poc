import { useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { routes } from ".";

export function AppHeader() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const pageTitle =
    routes.find((route) => route.url === currentPath)?.title ?? "Page";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b  bg-background/80 backdrop-blur-sm px-3">
      <div className="flex items-center justify-center pr-1">
        <SidebarTrigger />
      </div>
      <Separator orientation="vertical" className="mr-1" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
