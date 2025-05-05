
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VideoRepurposer from "./pages/VideoRepurposer";
import VideoLite from "./pages/VideoLite";
import ImageSpoofer from "./pages/ImageSpoofer";
import GifConverter from "./pages/GifConverter";
import Detector from "./pages/Detector";
import FileReducer from "./pages/FileReducer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/video-repurposer" element={<Layout><VideoRepurposer /></Layout>} />
          <Route path="/video-lite" element={<Layout><VideoLite /></Layout>} />
          <Route path="/image-spoofer" element={<Layout><ImageSpoofer /></Layout>} />
          <Route path="/gif-converter" element={<Layout><GifConverter /></Layout>} />
          <Route path="/detector" element={<Layout><Detector /></Layout>} />
          <Route path="/file-reducer" element={<Layout><FileReducer /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
