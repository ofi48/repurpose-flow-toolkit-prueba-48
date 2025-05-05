
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to Dashboard
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-dark">
      <div className="text-center">
        <p className="text-xl text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
