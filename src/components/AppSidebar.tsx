import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Video, 
  Image as ImageIcon, 
  FileImage, 
  Search, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/"
    },
    {
      name: "Video Repurposer",
      icon: Video,
      path: "/video-repurposer"
    },
    {
      name: "Image Spoofer",
      icon: ImageIcon,
      path: "/image-spoofer"
    },
    {
      name: "Similarity Detector",
      icon: Search,
      path: "/detector"
    },
    {
      name: "File Reducer",
      icon: FileImage,
      path: "/file-reducer"
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={cn("border-r border-border", state === "collapsed" ? "w-16" : "w-64")}>
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            C
          </div>
          {state !== "collapsed" && (
            <div>
              <h1 className="text-xl font-bold text-foreground">ContentWizard</h1>
              <p className="text-xs text-muted-foreground">Content Creation Toolkit</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("px-3 mb-2", state === "collapsed" && "sr-only")}>
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.path)}
                    className={cn(
                      "transition-colors",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <button
                      onClick={() => navigate(item.path)}
                      className="flex items-center space-x-3 w-full"
                    >
                      <item.icon size={20} />
                      {state !== "collapsed" && <span>{item.name}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-border">
        <SidebarMenuButton asChild className="hover:bg-accent hover:text-accent-foreground">
          <button className="flex items-center space-x-3 w-full">
            <LogOut size={20} />
            {state !== "collapsed" && <span>Log Out</span>}
          </button>
        </SidebarMenuButton>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;