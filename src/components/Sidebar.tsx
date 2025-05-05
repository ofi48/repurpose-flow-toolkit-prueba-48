
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Video, 
  Image as ImageIcon, 
  FileImage, 
  Search, 
  FileVideo, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      name: "Video Lite",
      icon: FileVideo,
      path: "/video-lite"
    },
    {
      name: "Image Spoofer",
      icon: ImageIcon,
      path: "/image-spoofer"
    },
    {
      name: "GIF Converter",
      icon: FileImage,
      path: "/gif-converter"
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

  return (
    <div className="w-60 h-screen bg-app-dark border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="text-app-blue">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14L18 7L29 14V28H7V14Z" stroke="currentColor" strokeWidth="2" />
              <path d="M15 20L18 17L21 20L21 28H15V20Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">RepurposeFlow</h1>
            <p className="text-xs text-gray-400">Content Repurposing Toolkit</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 py-5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={cn(
              "flex items-center space-x-3 px-5 py-3 text-left",
              location.pathname === item.path
                ? "bg-app-dark-accent text-app-blue border-l-2 border-app-blue"
                : "text-gray-400 hover:bg-app-dark-accent hover:text-white"
            )}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      <div className="p-5 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-4 py-2 text-gray-400 hover:text-white w-full text-left">
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
