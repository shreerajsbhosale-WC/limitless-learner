import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Target,
  Timer,
  BarChart3,
  Users,
  MessageSquare,
  Workflow,
  LogOut,
} from "lucide-react";
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
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";

const mainItems = [
  { title: "Dashboard", url: "/library", icon: LayoutDashboard },
  { title: "Study", url: "/study", icon: BookOpen },
  { title: "My Library", url: "/library", icon: Library },
  { title: "Habits", url: "/habits", icon: Target },
  { title: "Focus Timer", url: "/focus", icon: Timer },
  { title: "Weekly Report", url: "/weekly", icon: BarChart3 },
] as const;

const toolsItems = [
  { title: "Study Groups", url: "/groups", icon: Users },
  { title: "AI Tutor", url: "/assistant", icon: MessageSquare },
  { title: "Flowcharts", url: "/flowchart", icon: Workflow },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({
    select: (r) => r.location.pathname,
  });
  const { signOut } = useAuth();

  const isActive = (url: string) =>
    url === "/library" ? currentPath === "/library" : currentPath.startsWith(url);

  const renderItem = (item: { title: string; url: string; icon: typeof LayoutDashboard }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={item.title}
        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium"
      >
        <Link to={item.url}>
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        {collapsed ? (
          <div className="grid place-items-center">
            <div className="size-8 rounded-lg bg-gradient-primary" />
          </div>
        ) : (
          <Logo />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learn</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{toolsItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Log out">
              <LogOut className="size-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
