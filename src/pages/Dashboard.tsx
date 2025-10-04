
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Image as ImageIcon, FileImage, Search, Layers, Settings } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { TestEndpoints } from '@/components/TestEndpoints';

const Dashboard = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: "Video Repurposer",
      description: "Create unique video variants with advanced parameter controls",
      icon: Video,
      path: "/video-repurposer",
      color: "bg-blue-500"
    },
    {
      title: "Video Lite",
      description: "Quick video repurposing with automatic parameters",
      icon: Video,
      path: "/video-lite",
      color: "bg-indigo-500"
    },
    {
      title: "Image Spoofer",
      description: "Generate multiple image variants with subtle changes",
      icon: ImageIcon, 
      path: "/image-spoofer",
      color: "bg-purple-500"
    },
    {
      title: "Similarity Detector",
      description: "Compare two files to determine their similarity percentage",
      icon: Search,
      path: "/detector", 
      color: "bg-amber-500"
    },
    {
      title: "File Reducer",
      description: "Reduce file sizes while maintaining visual quality",
      icon: Layers,
      path: "/file-reducer",
      color: "bg-emerald-500"
    },
    {
      title: "Configuración",
      description: "Probar conexión con endpoints de Railway",
      icon: Settings,
      path: "/test-endpoints",
      color: "bg-gray-500"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Content Repurposing Toolkit</h1>
        <p className="text-gray-400 mt-2">
          Maximize your content with intelligent repurposing tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card 
            key={tool.path} 
            className="bg-app-dark-accent border-gray-800 hover:border-app-blue cursor-pointer transition-all hover:shadow-lg"
            onClick={() => navigate(tool.path)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-md ${tool.color}`}>
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-400">
                {tool.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Endpoints Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Prueba de Conectividad</h2>
        <TestEndpoints />
      </div>
    </div>
  );
};

export default Dashboard;
