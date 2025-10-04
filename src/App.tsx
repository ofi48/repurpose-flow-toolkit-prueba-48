
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { VideoQueueProvider } from "./contexts/VideoQueueContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VideoRepurposer from "./pages/VideoRepurposer";

import ImageSpoofer from "./pages/ImageSpoofer";
import Detector from "./pages/Detector";
import FileReducer from "./pages/FileReducer";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <VideoQueueProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/video-repurposer" element={<Layout><VideoRepurposer /></Layout>} />
              
              <Route path="/image-spoofer" element={<Layout><ImageSpoofer /></Layout>} />
              <Route path="/detector" element={<Layout><Detector /></Layout>} />
              <Route path="/file-reducer" element={<Layout><FileReducer /></Layout>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </VideoQueueProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
