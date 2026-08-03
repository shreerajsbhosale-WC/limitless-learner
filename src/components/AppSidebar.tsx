import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Calendar,
  MessageSquare,
  Trophy,
  StickyNote,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { title: "Dashboard", url: "/library", icon: LayoutDashboard },
  { title: "Study", url: "/study", icon: BookOpen },
  { title: "Habits", url: "/habits", icon: ClipboardList },
  { title: "Focus", url: "/focus", icon: HelpCircle },
  { title: "Weekly", url: "/weekly", icon: Calendar },
  { title: "Assistant", url: "/assistant", icon: MessageSquare },
  { title: "Groups", url: "/groups", icon: Trophy },
  { title: "Flowcharts", url: "/flowchart", icon: StickyNote },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { signOut } = useAuth();

  const isActive = (url: string) =>
    url === "/library" ? currentPath === "/library" : currentPath.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shrink-0 shadow-glow">
            <GraduationCap className="size-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display font-bold text-[15px]">Limitless</div>
              <div className="font-display font-bold text-[15px] -mt-0.5">Learner</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-10 rounded-xl data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium data-[active=true]:shadow-glow"
                  >
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Log out" className="h-10 rounded-xl text-muted-foreground">
              <LogOut className="size-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

