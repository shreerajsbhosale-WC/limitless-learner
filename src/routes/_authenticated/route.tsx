import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedShell,
});

function AuthedShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden sticky top-0 z-30 flex items-center gap-2 h-12 border-b bg-background/80 backdrop-blur px-3">
            <SidebarTrigger />
            <span className="font-display font-semibold">Limitless</span>
          </div>
          <div className="hidden md:flex absolute top-4 left-[calc(var(--sidebar-width,16rem)+0.5rem)] z-30 transition-all">
            <SidebarTrigger className="bg-card border shadow-sm" />
          </div>
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
