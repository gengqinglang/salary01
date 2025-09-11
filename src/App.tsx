import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 导入页面组件
import CareerPlanningPage from "./pages/CareerPlanningPage";
import CareerPlanCoachPage from "./pages/CareerPlanCoachPage";
import AICareerPlanningPage from "./pages/AICareerPlanningPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const getBaseName = () => {
  if (import.meta.env.MODE === 'production') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (window.location.hostname.endsWith('github.io') && segments.length > 0) {
      return `/${segments[0]}`;
    }
  }
  return '';
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen px-2 py-safe relative">
          <Toaster />
          <Sonner />
          <BrowserRouter basename={getBaseName()}>
            <Routes>
              {/* 职业规划相关路由 */}
              <Route path="/career-planning" element={<CareerPlanningPage />} />
              <Route path="/career-plan-coach" element={<CareerPlanCoachPage />} />
              <Route path="/ai-career-planning" element={<AICareerPlanningPage />} />
              
              {/* 默认重定向到职业规划页面 */}
              <Route path="/" element={<Navigate to="/career-planning" replace />} />
              <Route path="*" element={<Navigate to="/career-planning" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
