import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="max-h-screen h-[calc(100vh-48px)] w-full">
          <AppHeader />
          <main className="flex-1 overflow-auto has-[>[data-flush]]:overflow-hidden h-full w-full">
            <div className="h-full w-full px-2 py-1 has-[>[data-flush]]:p-0">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
