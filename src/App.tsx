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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen px-2 py-safe relative">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* 职业规划相关路由 */}
              <Route path="/" element={<div className="p-4"><h1 className="text-2xl font-bold text-center">工资收入测算工具</h1><p className="text-center mt-4">页面加载成功！</p></div>} />
              <Route path="/career-planning" element={<Navigate to="/" replace />} />
              <Route path="/career-plan-coach" element={<CareerPlanCoachPage />} />
              <Route path="/ai-career-planning" element={<AICareerPlanningPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
